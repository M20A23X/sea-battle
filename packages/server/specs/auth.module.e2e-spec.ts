import { HttpStatus, INestApplication } from '@nestjs/common';

import { DataSource } from 'typeorm';
import request, { Response } from 'supertest';

import { IUser, IUserPublicData } from 'shared/types/user';
import { Res } from 'shared/types/requestResponse';
import {
    IRefreshToken,
    TAccessTokenRes,
    TSignInData,
    TSignInRes,
} from 'shared/types/auth';
import { randomizeAction, randomString } from 'shared/utils/random.util';

import { RefreshToken } from '../src/modules/auth/models/entities/refreshToken.entity';
import { ACTION_RANDOM_PERCENT, HOOK_TIMEOUT } from './static/globals';

import { initApp } from './utils/initApp';
import { initializeDataSource, truncateTable } from './utils/dataSource';
import { createUsers, insertUsers } from './utils/users';
import { requireSignInUsers, TSignInUsers } from './utils/auth';

import { USERS_SCHEMA } from 'static/format';

import { RefreshTokenRepository } from 'repositories/refreshToken.repository';

import { User } from 'modules/user/models/entities/user.entity';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';

import { IUserService, UserService } from 'services/user.service';

type TRefreshJwtHeaders = Pick<IRefreshToken, 'token'> & TAccessTokenRes;

const userDataArr: IUser[] = createUsers();
const REFRESH_SUCCESS_RES = 'Successfully refresh access tokens';

const mapResBody = (res: Res<TSignInRes>): Res<TSignInRes> => {
    if (res.payload) {
        expect([
            USERS_SCHEMA.uuid.regex.test(res.payload.refreshToken),
            USERS_SCHEMA.jwt.regex.test(res.payload.accessToken),
        ]).toStrictEqual([true, true]);
    }
    const payloadMapped: TSignInRes | null = res.payload
        ? {
              user: { ...res.payload.user },
              refreshToken: '',
              accessToken: '',
          }
        : null;
    return { ...res, payload: payloadMapped };
};

describe('Auth module tests.', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let usersService: IUserService;
    let refreshTokenRepository: RefreshTokenRepository;
    let signInUsers: TSignInUsers;

    ///--- Utils ---///
    const createRefreshReqArr = async (): Promise<
        [TRefreshJwtHeaders[], Res<TAccessTokenRes>[]]
    > => {
        const expectedResArr: Res<TAccessTokenRes>[] = [];
        const [signInResArr] = await signInUsers(app);

        const reqArr: TRefreshJwtHeaders[] = signInResArr
            .filter(({ payload }: Res<TSignInRes>) => payload)
            .map(({ payload }): TRefreshJwtHeaders => {
                const expectedRes: Res<TAccessTokenRes> = {
                    message: REFRESH_SUCCESS_RES,
                    payload: { accessToken: '' },
                };
                expectedResArr.push(expectedRes);
                return {
                    token: payload!.refreshToken,
                    accessToken: 'Bearer '.concat(payload!.accessToken),
                };
            });

        return [reqArr, expectedResArr];
    };

    const sendRefreshTokenReqs = async (
        reqArr: TRefreshJwtHeaders[],
        expectedResArr: Res<TAccessTokenRes>[],
    ): Promise<void> => {
        for (const [resIndex, dto] of reqArr.entries()) {
            const expectedStatus: HttpStatus = /forbidden/i.test(
                expectedResArr[resIndex].message,
            )
                ? HttpStatus.FORBIDDEN
                : expectedResArr[resIndex]['payload'] === null
                ? HttpStatus.UNAUTHORIZED
                : HttpStatus.OK;

            const res: Response = await request(app.getHttpServer())
                .put('/auth/refresh')
                .set('authorization', dto.accessToken)
                .set('x-refresh-token', dto.token);

            const resBody: Res<TAccessTokenRes> =
                res.body as Res<TAccessTokenRes>;
            if (resBody.payload) resBody.payload.accessToken = '';

            if (res.statusCode !== expectedStatus) {
                console.info(`Refresh request:`, dto);
                console.info(`Refresh response:`, res.body);
            }
            expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            expect(res.statusCode).toEqual(expectedStatus);
        }
    };

    ///--- Prepare ---///

    beforeAll(async () => {
        const [initializedApp, moduleRef] = await initApp();
        app = initializedApp;
        dataSource = moduleRef.get<DataSource>(DataSource);
        usersService = moduleRef.get<IUserService>(UserService);
        refreshTokenRepository = moduleRef.get<RefreshTokenRepository>(
            RefreshTokenRepository,
        );
        signInUsers = requireSignInUsers(userDataArr, usersService);
        await initializeDataSource(dataSource);
    }, HOOK_TIMEOUT);
    afterEach(async () => {
        await truncateTable(dataSource, RefreshToken);
        await truncateTable(dataSource, User);
    }, HOOK_TIMEOUT);
    afterAll(async () => await dataSource.destroy(), HOOK_TIMEOUT);

    ///--- Cases ---///

    ///--- /POST SIGN_IN ---///
    it(
        '/POST SIGN_IN: should successfully sign in users',
        async () => {
            const [resArr, expectedResArr] = await signInUsers(app, {
                mapResBody,
            });
            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        "/POST SIGN_IN: should prevent sign in users that aren't exists",
        async () => {
            const [usersCreateDTOArr, usersPublicDataArr]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);
            const expectedResArr: Res<TSignInRes>[] = [];

            const reqArr: TSignInData[] = (
                usersPublicDataArr.payload || []
            ).map((user: IUserPublicData, index: number): TSignInData => {
                const username: string = randomizeAction(
                    ACTION_RANDOM_PERCENT,
                    () =>
                        randomString(
                            USERS_SCHEMA.username.maxLength,
                            USERS_SCHEMA.username.minLength,
                        ),
                    () => user.username,
                );
                const req: TSignInData = {
                    username,
                    password: usersCreateDTOArr[index].user.password,
                };

                let expectedRes: Res<TSignInRes>;
                if (req.username === user.username) {
                    expectedRes = {
                        message: `Successfully sign in users, username '${user.username}'`,
                        payload: { user, accessToken: '', refreshToken: '' },
                    };
                } else {
                    expectedRes = {
                        message: `Error read users: no users found, qualifier '${req.username}'!`,
                        payload: null,
                    };
                }

                expectedResArr.push(expectedRes);
                return req;
            });

            const getStatus = (resIndex): HttpStatus =>
                expectedResArr[resIndex].payload
                    ? HttpStatus.CREATED
                    : HttpStatus.NOT_FOUND;
            const [resArr] = await signInUsers(app, {
                reqArr,
                getStatus,
                mapResBody,
            });
            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/POST SIGN_IN: should prevent sign in users with incorrect password',
        async () => {
            const [usersCreateDTOArr, usersPublicDataArr]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res<TSignInRes>[] = [];
            const reqArr: TSignInData[] = (
                usersPublicDataArr.payload || []
            ).map((user: IUserPublicData, index: number): TSignInData => {
                const correctPassword: string =
                    usersCreateDTOArr[index].user.password;
                const password: string = randomizeAction(
                    ACTION_RANDOM_PERCENT,
                    () =>
                        randomString(
                            USERS_SCHEMA.password.maxLength,
                            USERS_SCHEMA.password.minLength,
                        ),
                    () => correctPassword,
                );
                const req: TSignInData = {
                    username: user.username,
                    password,
                };

                let expectedRes: Res<TSignInRes>;
                if (req.password === correctPassword) {
                    expectedRes = {
                        message: `Successfully sign in users, username '${user.username}'`,
                        payload: { user, accessToken: '', refreshToken: '' },
                    };
                } else {
                    expectedRes = {
                        message: `Error sign in users: passwords don't match, username '${req.username}'!`,
                        payload: null,
                    };
                }

                expectedResArr.push(expectedRes);
                return req;
            });

            const getStatus = (index: number) =>
                expectedResArr[index].payload
                    ? HttpStatus.CREATED
                    : HttpStatus.UNAUTHORIZED;
            const [resArr] = await signInUsers(app, {
                reqArr,
                mapResBody,
                getStatus,
            });
            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    ///--- /GET REFRESH ---///
    it(
        '/GET REFRESH: should successfully refresh access tokens',
        async () => {
            const [reqArr, expectedResArr] = await createRefreshReqArr();
            await sendRefreshTokenReqs(reqArr, expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/GET REFRESH: should prevent refresh access tokens with no refresh or access tokens provided',
        async () => {
            const [reqArrRaw, expectedResArr] = await createRefreshReqArr();

            const reqArr: TRefreshJwtHeaders[] = reqArrRaw.map(
                (
                    req: TRefreshJwtHeaders,
                    index: number,
                ): TRefreshJwtHeaders => {
                    let expectedRes: Res<TAccessTokenRes>;
                    const accessToken: string = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => '',
                        () => req.accessToken,
                    );
                    const token: string = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => '',
                        () => req.token,
                    );
                    if (accessToken) {
                        if (token) {
                            expectedRes = {
                                message: REFRESH_SUCCESS_RES,
                                payload: { accessToken: '' },
                            };
                        } else {
                            expectedRes = {
                                message:
                                    'Error refresh access tokens: no refresh token provided!',
                                payload: null,
                            };
                        }
                    } else {
                        expectedRes = {
                            message:
                                'Error process requests: forbidden resource!',
                            payload: null,
                        };
                    }

                    expectedResArr[index] = expectedRes;
                    return { accessToken, token };
                },
            );

            await sendRefreshTokenReqs(reqArr, expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/GET REFRESH: should prevent refresh access tokens with incorrect refresh tokens provided',
        async () => {
            const [reqArrRaw, expectedResArr] = await createRefreshReqArr();

            const reqArr: TRefreshJwtHeaders[] = reqArrRaw.map(
                (
                    req: TRefreshJwtHeaders,
                    index: number,
                ): TRefreshJwtHeaders => {
                    let expectedRes: Res<TAccessTokenRes>;
                    const token: string = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () =>
                            randomString(
                                USERS_SCHEMA.uuid.maxLength,
                                USERS_SCHEMA.uuid.maxLength,
                            ),
                        () => req.token,
                    );
                    if (token === req.token) {
                        expectedRes = {
                            message: REFRESH_SUCCESS_RES,
                            payload: { accessToken: '' },
                        };
                    } else {
                        expectedRes = {
                            message:
                                'Error refresh access tokens: no session found for this token - please, sign in first!',
                            payload: null,
                        };
                    }

                    expectedResArr[index] = expectedRes;
                    return {
                        accessToken: req.accessToken,
                        token,
                    };
                },
            );

            await sendRefreshTokenReqs(reqArr, expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/GET REFRESH: should prevent refresh access tokens for expired sessions',
        async () => {
            const [reqArr, expectedResArr] = await createRefreshReqArr();

            for (const [index, req] of reqArr.entries()) {
                const dataChangePromise: Promise<unknown> = randomizeAction(
                    ACTION_RANDOM_PERCENT,
                    () => {
                        expectedResArr[index] = {
                            message:
                                'Error refresh access tokens: session expired - please, sign in again!',
                            payload: null,
                        };
                        return refreshTokenRepository
                            .createQueryBuilder()
                            .update()
                            .set({
                                expirationDateTime: new Date(Date.now() - 1000),
                            })
                            .where({ token: req.token })
                            .execute();
                    },
                    () =>
                        new Promise((resolve) => {
                            return resolve({
                                generatedMaps: [],
                                raw: [],
                                affected: 0,
                            });
                        }),
                );
                await dataChangePromise;
            }
            await sendRefreshTokenReqs(reqArr, expectedResArr);
        },
        HOOK_TIMEOUT,
    );
});
