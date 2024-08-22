import { v4 } from 'uuid';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import {
    IConfigSpecs,
    ISpecsConfig,
    IAccessPayload,
    IEmail,
    IEnvConfig,
    IImgPath,
    IJwtConfig,
    IPasswordSet,
    IUser,
    IUserCreate,
    IUsername,
    IUserPublic,
    MimeType,
    ResData,
    TokenTypeEnum
} from '#shared/types/interfaces';
import { SpecsConfig, Route } from '#shared/static';

import { init, requireRunTest, truncateTable } from './utils';

import { IConfig } from '#/types';
import { IEmailConfig } from '#/types/interfaces';

import {
    UserDeleteDTO,
    UserEntity,
    UserReadDTOType,
    UserUpdateDTO
} from '#/modules/user';
import { LoggerService, ReadParamEnum, UserService } from '#/services';

describe('Users module', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    // --- Logger -------------------------------------------------------------
    let logger: LoggerService;

    // --- Configs --------------------
    let specs: ISpecsConfig = SpecsConfig.specs;

    // --- Jwt --------------------
    let accessToken: string;

    // --- Services --------------------
    let userService: UserService;

    // --- Test --------------------
    let runTest: ReturnType<typeof requireRunTest>;

    const user1: IUserCreate = {
        email: 'sample1@email.com',
        username: 'username',
        passwordSet: {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            password: 'Us24mmsv200#',
            passwordConfirm: 'Us24mmsv200#'
        },
        imgPath: ''
    };
    const user2: IUserCreate = {
        email: 'sample2@email.com',
        username: 'XXusernameXX',
        passwordSet: {
            password: 'Us24mmsv200#',
            passwordConfirm: 'Us24mmsv200#'
        },
        imgPath: ''
    };

    let sampleUser1: IUserPublic;
    let sampleUser2: IUserPublic;

    beforeAll(async () => {
        [app, specs, logger, dataSource] = await init();
        // --- Configs --------------------
        const configService: ConfigService<IConfig & IConfigSpecs> =
            app.get(ConfigService);
        specs = configService.getOrThrow('specs');
        const jwt: IJwtConfig = configService.getOrThrow('jwt');
        const email: IEmailConfig = configService.getOrThrow('email');
        const env: IEnvConfig = configService.getOrThrow('env');

        // --- Services --------------------
        userService = app.get<UserService>(UserService);

        // --- JWT --------------------
        const jwtOptions: JwtSignOptions = {
            issuer: env.appId,
            audience: env.frontEndOrigin,
            subject: email.credentials.username,
            expiresIn: jwt.tokens[TokenTypeEnum.ACCESS].timeMs,
            algorithm: 'RS256'
        };
        const jwtPayload: IAccessPayload = { uuid: v4(), username: 'username' };
        const token: string = Jwt.sign(
            jwtPayload,
            jwt.tokens[TokenTypeEnum.ACCESS].privateKey,
            jwtOptions
        );
        accessToken = `Bearer ${token}`;
        logger.debug(token);

        runTest = requireRunTest(app, accessToken, env.frontEndOrigin);
    }, SpecsConfig.specs.getHookTimeoutMs());
    beforeEach(async () => {
        const userId1: number = await userService.create(user1);
        const userId2: number = await userService.create(user2);
        [sampleUser1, sampleUser2] = await userService.read(
            ReadParamEnum.IdRange,
            { startId: userId1, endId: userId2 },
            false
        );
        logger.debug(sampleUser1);
    }, SpecsConfig.specs.getHookTimeoutMs());
    afterEach(
        async () => await truncateTable(dataSource, UserEntity),
        SpecsConfig.specs.getHookTimeoutMs()
    );
    afterAll(
        async () => await dataSource.destroy(),
        SpecsConfig.specs.getHookTimeoutMs()
    );

    it(
        'should response with status 403',
        async () => {
            const dto: UserReadDTOType = { user: { uuid: 'uuid' } };
            const res: Response = await request(app.getHttpServer())
                .get(Route.users.index)
                .set('Content-type', MimeType.ApplicationJson)
                .set('Accepts', MimeType.ApplicationJson)
                .send(dto);
            const body = res.body as ResData;
            expect(body.message).toEqual("Error: access token isn't provided");
            expect(res.statusCode).toEqual(HttpStatus.FORBIDDEN);
        },
        specs.getHookTimeoutMs()
    );

    describe(Route.users.index + ' DELETE', function () {
        const runDeleteTest = (
            dto: UserDeleteDTO,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully deleted the user`
        ): Promise<void> => {
            return runTest('delete', Route.users.index, dto, status, message);
        };

        it(
            'should delete user',
            async () => {
                const { uuid } = sampleUser1;
                const dto: UserDeleteDTO = { user: { uuid } };
                await runDeleteTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't delete user because of the bad request",
            async () => {
                const dto: any = { user: { wrongField: 123 } };
                // eslint-disable-next-line sonarjs/no-duplicate-string
                const message = 'Error: property wrongField should not exist';
                await runDeleteTest(dto, HttpStatus.BAD_REQUEST, message);
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.users.index + ' PUT', function () {
        const runUpdateTest = <T extends object>(
            dto: UserUpdateDTO,
            payload: T | undefined,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully updated the user`
        ): Promise<void> => {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            const url = Route.users.index;
            return runTest('put', url, dto, status, message, payload);
        };

        it(
            'should update user credentials because of updating user data',
            async () => {
                const newData: IUsername = {
                    username: 'newUsername'
                };
                const dto: UserUpdateDTO = {
                    user: { uuid: sampleUser1.uuid, ...newData }
                };

                await runUpdateTest(dto, { ...sampleUser1, ...newData });
                const [user]: IUser[] = await userService.read(
                    ReadParamEnum.Uuid,
                    { uuid: sampleUser1.uuid },
                    true
                );
                expect(
                    user.credentials.updatedAt.getTime() ===
                        user.credentials.createdAt.getTime()
                ).toEqual(false);
                expect(
                    user.credentials.passwordUpdatedAt.getTime() ===
                        user.credentials.createdAt.getTime()
                ).toEqual(false);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should update user parameters without new email and password',
            async () => {
                const newData: IUsername & IImgPath = {
                    username: 'newUsername',
                    imgPath: 'sample/path/file.ext'
                };
                const dto: UserUpdateDTO = {
                    user: { uuid: sampleUser1.uuid, ...newData }
                };

                await runUpdateTest(dto, { ...sampleUser1, ...newData });
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should update user parameters with a new email',
            async () => {
                const newData: IEmail = {
                    email: 'newemail@email.com'
                };
                const dto: UserUpdateDTO = {
                    user: { uuid: sampleUser1.uuid, ...newData }
                };

                await runUpdateTest(dto, { ...sampleUser1, ...newData });
                const [user]: IUser[] = await userService.read(
                    ReadParamEnum.Email,
                    newData,
                    true
                );
                expect(user.credentials.version).toEqual(1);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should update user parameters with a new password',
            async () => {
                const newData: IPasswordSet = {
                    passwordSet: {
                        // eslint-disable-next-line sonarjs/no-duplicate-string
                        password: 'NewUs24mmsv200#',
                        passwordConfirm: 'NewUs24mmsv200#'
                    }
                };
                const dto: UserUpdateDTO = {
                    user: { uuid: sampleUser1.uuid, ...newData }
                };

                await runUpdateTest(dto, { ...sampleUser1 });
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't update user because of the bad request",
            async () => {
                const dto: any = { user: { wrongField: 123 } };
                await runUpdateTest(
                    dto,
                    undefined,
                    HttpStatus.BAD_REQUEST,
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't update user because of the passwords-don't-match request",
            async () => {
                const dto: UserUpdateDTO = {
                    user: {
                        uuid: sampleUser1.uuid,
                        passwordSet: {
                            password: 'NewUs24mmsv200#',
                            passwordConfirm: 'NewUs24mmsv200$'
                        }
                    }
                };
                await runUpdateTest(
                    dto,
                    undefined,
                    HttpStatus.BAD_REQUEST,
                    "Error: passwords don't match"
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.users.index + ' GET', function () {
        const runReadTest = <T extends object>(
            dto: UserReadDTOType,
            payload: T[] | undefined,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully read the users`
        ): Promise<void> => {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            const url = Route.users.index;
            return runTest('get', url, dto, status, message, payload);
        };

        it(
            'should read single user by uuid',
            async () => {
                const dto: UserReadDTOType = {
                    user: { uuid: sampleUser1.uuid }
                };
                await runReadTest(dto, [sampleUser1]);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should read single user by username',
            async () => {
                const dto: UserReadDTOType = {
                    user: { username: sampleUser2.username }
                };
                await runReadTest(dto, [sampleUser2]);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should read users by similar username',
            async () => {
                const dto: UserReadDTOType = {
                    user: { username: sampleUser1.username }
                };
                await runReadTest(dto, [sampleUser1, sampleUser2]);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should read single user by email',
            async () => {
                const dto: UserReadDTOType = {
                    user: { email: sampleUser1.email }
                };
                await runReadTest(dto, [sampleUser1]);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should read users by id range',
            async () => {
                const dto: UserReadDTOType = { user: { startId: 1, endId: 2 } };
                await runReadTest(dto, [sampleUser1, sampleUser2]);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't read users because of the bad request",
            async () => {
                const dto: any = { user: { wrongField: 123 } };
                await runReadTest(
                    dto,
                    undefined,
                    HttpStatus.BAD_REQUEST,
                    'Error: incorrect request'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't read users because of not existing email",
            async () => {
                const dto: UserReadDTOType = {
                    user: { email: 'nonexisting@email.com' }
                };
                await runReadTest(
                    dto,
                    undefined,
                    HttpStatus.NOT_FOUND,
                    "Error: user with specified data isn't found"
                );
            },
            specs.getHookTimeoutMs()
        );
    });
});
