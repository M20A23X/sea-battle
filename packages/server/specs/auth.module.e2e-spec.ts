import { v4 } from 'uuid';
import request, { Response } from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
    IUser,
    IRefreshToken,
    AccessTokenRes,
    SignInData,
    SignInRes,
    TestRes
} from '#shared/types';

import { RandomAction, randomizeAction } from '#shared/utils';

import { SPECS_HOOK_TIMEOUT_MS, MIME_TYPE } from '#shared/static';

import {
    SignInUsers,
    CreateUsers,
    initApp,
    initializeDataSource,
    truncateTable,
    createSignInDTOs,
    requireSignInUsers,
    createUserCreateDTOs,
    expandRegex,
    requireCreateUsers
} from './utils';

import { USERS_SCHEMA } from '#/static';

import { RefreshTokenRepository } from '#/repositories';
import {
    IUserService,
    UserService,
    AuthService,
    IAuthService
} from '#/services';

import { SignInDTO, RefreshToken } from '#/modules/auth';
import { User, UserCreateDTO } from '#/modules/user';

type RefreshTokenHeaders = Pick<IRefreshToken, 'token'> & AccessTokenRes;

const UuidRegex: RegExp = USERS_SCHEMA.uuid.regex;
const AccessTokenRegex: RegExp = USERS_SCHEMA.accessToken.regex;

const [userCreateDTOs]: [UserCreateDTO[], TestRes[]] = createUserCreateDTOs();

describe('Auth module tests.', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let refreshTokenRepository: RefreshTokenRepository;
    let signInUsers: SignInUsers;
    let createUsers: CreateUsers;

    ///--- Prepare ---///

    beforeAll(async () => {
        const [moduleRef, initializedApp] = await initApp();
        app = initializedApp;
        dataSource = moduleRef.get<DataSource>(DataSource);
        refreshTokenRepository = moduleRef.get<RefreshTokenRepository>(
            RefreshTokenRepository
        );
        signInUsers = requireSignInUsers(
            moduleRef.get<IAuthService>(AuthService)
        );
        createUsers = requireCreateUsers(
            moduleRef.get<IUserService>(UserService)
        );

        await initializeDataSource(dataSource);
    }, SPECS_HOOK_TIMEOUT_MS);
    afterEach(async () => {
        await truncateTable(dataSource, RefreshToken);
        await truncateTable(dataSource, User);
    }, SPECS_HOOK_TIMEOUT_MS);
    afterAll(async () => await dataSource.destroy(), SPECS_HOOK_TIMEOUT_MS);

    ///--- Cases ---///

    ///--- /POST SIGN_IN ---///
    it(
        '/POST SIGN_IN: should sign in/prevent sign in non existent users',
        async () => {
            type ActionArgs = { signInDataRaw: SignInData; user: IUser };
            type ActionReturn = [SignInData, TestRes<SignInRes | void>];
            const signInActions: RandomAction<ActionArgs, ActionReturn>[] = [
                ({ signInDataRaw, user }) => {
                    const exResp: TestRes<SignInRes> = {
                        message: `Successfully sign in users, username '${signInDataRaw.username}'`,
                        payload: {
                            user: user,
                            accessToken: '',
                            refreshToken: ''
                        },
                        status: HttpStatus.CREATED
                    };
                    return [signInDataRaw, exResp];
                },
                ({ signInDataRaw }) => {
                    const [nonExistentUsername] = expandRegex(
                        USERS_SCHEMA.username.regex,
                        1
                    );
                    const signInData: SignInData = {
                        ...signInDataRaw,
                        username: nonExistentUsername
                    };
                    const exResp: TestRes = {
                        message: `Error read users: no users found, qualifier '${signInData.username}'!`,
                        status: HttpStatus.NOT_FOUND
                    };
                    return [signInData, exResp];
                },
                ({ signInDataRaw }) => {
                    const [nonExistentPassword] = expandRegex(
                        USERS_SCHEMA.password.regex,
                        1
                    );
                    const signInData: SignInData = {
                        ...signInDataRaw,
                        password: nonExistentPassword
                    };
                    const exResp: TestRes = {
                        message: `Error sign in users: passwords don't match, username '${signInData.username}'!`,
                        status: HttpStatus.UNAUTHORIZED
                    };
                    return [signInData, exResp];
                }
            ];

            const users: IUser[] = await createUsers(userCreateDTOs, true);
            const singInsDataRaw: SignInData[] = createSignInDTOs(
                userCreateDTOs
            ).map(
                (signInDTO: SignInDTO, index: number): SignInData => ({
                    username: signInDTO.user.username,
                    password: userCreateDTOs[index].user.password
                })
            );

            const exRes: TestRes<SignInRes | void>[] = [];
            const singInDTOs: SignInDTO[] = singInsDataRaw.map(
                (signInData: SignInData, index: number): SignInDTO => {
                    const [signInDTO, exResp] = randomizeAction<
                        ActionArgs,
                        ActionReturn
                    >(signInActions, [
                        { signInDataRaw: signInData, user: users[index] }
                    ]);
                    exRes.push(exResp);
                    return { user: signInDTO };
                }
            );

            for (const [index, dto] of singInDTOs.entries()) {
                const exResp: TestRes<SignInRes | void> = exRes[index];
                const res: Response = await request(app.getHttpServer())
                    .post('/auth/signin')
                    .set('Content-type', MIME_TYPE.applicationJson)
                    .set('Accepts', MIME_TYPE.applicationJson)
                    .send(dto);

                if (res.statusCode !== exResp.status) {
                    console.info(`Sign In request:`, dto);
                    console.info(`Sign In response:`, res.body);
                }
                if (exResp?.['payload']) {
                    const resPayload: SignInRes = res.body
                        ?.payload as SignInRes;
                    expect(resPayload !== undefined).toEqual(true);

                    const isTokensCorrect: boolean =
                        UuidRegex.test(resPayload.refreshToken) &&
                        AccessTokenRegex.test(resPayload.accessToken);
                    expect(isTokensCorrect).toEqual(true);
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        SPECS_HOOK_TIMEOUT_MS
    );

    ///--- /GET REFRESH ---///
    it(
        '/GET REFRESH access token: should refresh/prevent refresh with no refresh or access tokens provided/no session/expired session',
        async () => {
            type ActionReturn = [
                RefreshTokenHeaders,
                TestRes<AccessTokenRes | void>
            ];
            const incorrectToken: string = v4();
            const refreshActions: RandomAction<
                RefreshTokenHeaders,
                ActionReturn
            >[] = [
                (headers: RefreshTokenHeaders) => {
                    const exResp: TestRes<AccessTokenRes> = {
                        message: 'Successfully refresh access tokens',
                        payload: { accessToken: '' },
                        status: HttpStatus.OK
                    };
                    return [{ ...headers }, exResp];
                },
                (headers: RefreshTokenHeaders) => {
                    const exResp: TestRes = {
                        message: 'Error process requests: Forbidden resource!',
                        status: HttpStatus.FORBIDDEN
                    };
                    return [{ ...headers, accessToken: '' }, exResp];
                },
                (headers: RefreshTokenHeaders) => {
                    const exResp: TestRes = {
                        message:
                            'Error refresh access tokens: no refresh token provided!',
                        status: HttpStatus.UNAUTHORIZED
                    };
                    return [{ ...headers, token: '' }, exResp];
                },
                (headers: RefreshTokenHeaders) => {
                    const exResp: TestRes = {
                        message:
                            'Error refresh access tokens: no session found for this token - please, sign in first!',
                        status: HttpStatus.UNAUTHORIZED
                    };
                    return [{ ...headers, token: incorrectToken }, exResp];
                },
                (headers: RefreshTokenHeaders) => {
                    const exResp: TestRes = {
                        message:
                            'Error refresh access tokens: session expired - please, sign in again!',
                        status: HttpStatus.UNAUTHORIZED
                    };
                    return [{ ...headers }, exResp];
                }
            ];

            await createUsers(userCreateDTOs, true);
            const singInDTOs: SignInDTO[] = createSignInDTOs(userCreateDTOs);
            const signInRes: SignInRes[] = await signInUsers(singInDTOs);

            const exRes: TestRes<SignInRes | void>[] = [];
            const refreshHeaders: RefreshTokenHeaders[] = signInRes.map(
                (signInRes: SignInRes): RefreshTokenHeaders => {
                    const headers: RefreshTokenHeaders = {
                        token: signInRes.refreshToken,
                        accessToken: signInRes.accessToken
                    };
                    const [headersMapped, exResp] = randomizeAction<
                        RefreshTokenHeaders,
                        ActionReturn
                    >(refreshActions, [headers]);

                    const refreshHeaders: RefreshTokenHeaders = {
                        token: headersMapped.token,
                        accessToken: 'Bearer '.concat(headersMapped.accessToken)
                    };
                    exRes.push(exResp);
                    return refreshHeaders;
                }
            );

            for (const [index, dto] of refreshHeaders.entries()) {
                const exResp: TestRes<SignInRes | void> = exRes[index];
                if (/expired/i.test(exResp.message)) {
                    try {
                        await refreshTokenRepository
                            .createQueryBuilder('r')
                            .update()
                            .set({
                                expirationDateTime: new Date(0)
                            })
                            .where({ token: dto.token })
                            .execute();
                    } catch (error: unknown) {
                        console.error(JSON.stringify(error));
                    }
                }

                const req: request.Test = request(app.getHttpServer())
                    .put('/auth/refresh')
                    .set('authorization', dto.accessToken);

                if (dto.token) req.set('x-refresh-token', dto.token);
                const res: Response = await req;

                if (res.statusCode !== exResp.status) {
                    console.info(`Refresh request:`, dto);
                    console.info(`Refresh response:`, res.body);
                }
                if (exResp?.['payload']) {
                    const resPayload: AccessTokenRes = res.body
                        ?.payload as AccessTokenRes;
                    expect(resPayload !== undefined).toEqual(true);
                    expect(
                        AccessTokenRegex.test(resPayload.accessToken)
                    ).toEqual(true);
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        SPECS_HOOK_TIMEOUT_MS
    );
});
