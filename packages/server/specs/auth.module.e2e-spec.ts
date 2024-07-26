import * as Jwt from 'jsonwebtoken';
import { v4 } from 'uuid';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

import { IConfigSpecs, ISpecsConfig } from '#shared/specs/types';
import { SpecsConfig } from '#shared/specs/static';
import {
    IAccessPayload,
    IAuthResult,
    IEnvConfig,
    IJwtConfig,
    IUserCreate,
    IUserPublic,
    TokenTypeEnum
} from '#shared/types/interfaces';
import { Format, Route } from '#shared/static';

import { getRoute } from 'shared/src/utils';
import { init, requireRunTest, truncateTable, waitDataSource } from './utils';

import { IConfig } from '#/types';
import { IEmailConfig } from '#/types/interfaces';
import { UserEntity } from '#/modules/user';
import {
    ConfirmationTokenDTO,
    RefreshTokenAccessDTO,
    RequestPasswordResetDTO,
    ResetPasswordDTO,
    SignInDTO,
    SignOutDTO,
    SignUpDTO
} from '#/modules/auth';
import { AuthService, LoggerService, UserService } from '#/services';

describe('Auth module', () => {
    let dataSource: DataSource;

    // --- Logger -------------------------------------------------------------
    let logger: LoggerService;

    // --- Configs --------------------
    let specs: ISpecsConfig = SpecsConfig.specs;
    let env: IEnvConfig;

    // --- Jwt --------------------
    let accessToken: string;
    let refreshToken: string;

    // --- Services --------------------
    let userService: UserService;
    let authService: AuthService;

    // --- Test --------------------
    let runTest: ReturnType<typeof requireRunTest>;

    const user: IUserCreate = {
        email: 'sample1@email.com',
        username: 'username',
        // eslint-disable-next-line sonarjs/no-duplicate-string
        passwordSet: {
            // eslint-disable-next-line sonarjs/no-duplicate-string
            password: 'Us24mmsv200#',
            passwordConfirm: 'Us24mmsv200#'
        },
        imgPath: ''
    };

    let sampleUser: IUserPublic;

    beforeAll(async () => {
        let app: INestApplication;
        [app, specs, logger] = await init();
        // --- Configs --------------------
        const configService: ConfigService<IConfig & IConfigSpecs> =
            app.get(ConfigService);
        specs = configService.getOrThrow('specs');
        env = configService.getOrThrow('env');
        const jwt: IJwtConfig = configService.getOrThrow('jwt');
        const email: IEmailConfig = configService.getOrThrow('email');

        // --- Datasource --------------------
        dataSource = app.get<DataSource>(DataSource);
        await waitDataSource(dataSource, specs.connectionCheckIntervalMs);

        // --- Services --------------------
        userService = app.get<UserService>(UserService);
        authService = app.get<AuthService>(AuthService);

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
    afterEach(
        async () => await truncateTable(dataSource, UserEntity),
        SpecsConfig.specs.getHookTimeoutMs()
    );
    afterAll(
        async () => await dataSource.destroy(),
        SpecsConfig.specs.getHookTimeoutMs()
    );

    describe(Route.auth.accessRefresh + ' GET', function () {
        // --- Test --------------------

        beforeEach(async () => {
            const [createdUser, token] = await authService.signUp(user);
            await authService.confirmEmail(token);
            const signInRes: IAuthResult = await authService.signIn({
                usernameOrEmail: createdUser.username,
                password: user.passwordSet.password
            });
            refreshToken = signInRes.session.refreshToken;
            sampleUser = await UserService.extractUserPublic(createdUser);
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runRefreshTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully refreshed token access`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'accessRefresh');
            return runTest('get', url, dto, status, message);
        };

        it(
            'should refresh token access',
            async () => {
                const dto: RefreshTokenAccessDTO = {
                    auth: { token: refreshToken }
                };
                await runRefreshTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't refresh token access because of the bad request",
            async () => {
                const dto: any = { auth: { wrongField: 'somedata' } };
                await runRefreshTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't refresh token access because of invalid token",
            async () => {
                const dto: RefreshTokenAccessDTO = {
                    auth: { token: refreshToken + 'a' }
                };
                await runRefreshTest(
                    dto,
                    HttpStatus.FORBIDDEN,
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    'Error: invalid token'
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.signOut + ' POST', function () {
        // --- Test --------------------

        beforeEach(async () => {
            const [createdUser, token] = await authService.signUp(user);
            await authService.confirmEmail(token);
            const signInRes: IAuthResult = await authService.signIn({
                usernameOrEmail: createdUser.username,
                password: user.passwordSet.password
            });
            refreshToken = signInRes.session.refreshToken;
            sampleUser = await UserService.extractUserPublic(createdUser);
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runSignOutTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.CREATED,
            message = `Successfully signed out the user`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'signOut');
            return runTest('post', url, dto, status, message);
        };

        it(
            'should sign out the user',
            async () => {
                const dto: SignOutDTO = {
                    auth: { token: refreshToken }
                };
                await runSignOutTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign out the user because of the bad request",
            async () => {
                const dto: any = { auth: { wrongField: 'somedata' } };
                await runSignOutTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign out the user because of invalid token",
            async () => {
                const dto: RefreshTokenAccessDTO = {
                    auth: { token: refreshToken + 'a' }
                };
                await authService.signOut(refreshToken);
                await runSignOutTest(
                    dto,
                    HttpStatus.FORBIDDEN,
                    'Error: invalid token'
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.signIn + ' POST', function () {
        // --- Test --------------------

        beforeEach(async () => {
            const [createdUser, token] = await authService.signUp(user);
            await authService.confirmEmail(token);
            sampleUser = await UserService.extractUserPublic(createdUser);
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runSignInTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.CREATED,
            message = `Successfully signed in the user`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'signIn');
            return runTest('post', url, dto, status, message);
        };

        it(
            'should sign in the user by username',
            async () => {
                const dto: SignInDTO = {
                    auth: {
                        usernameOrEmail: user.username,
                        password: user.passwordSet.password
                    }
                };
                await runSignInTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            'should sign in the user by email',
            async () => {
                const dto: SignInDTO = {
                    auth: {
                        usernameOrEmail: user.email,
                        password: user.passwordSet.password
                    }
                };
                await runSignInTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign in the user because of the bad request",
            async () => {
                const dto: any = { auth: { wrongField: 'somedata' } };
                await runSignInTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign in the user because of passwords-don't-match error",
            async () => {
                const dto: SignInDTO = {
                    auth: {
                        usernameOrEmail: user.username,
                        password: user.passwordSet.password + '3'
                    }
                };
                await runSignInTest(
                    dto,
                    HttpStatus.UNAUTHORIZED,
                    "Error: passwords don't match - you changed your password recently"
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign in the user because of unconfirmed email",
            async () => {
                const [createdUser] = await authService.signUp({
                    email: 'samplee@gmail.com',
                    username: 'usernamee',
                    passwordSet: user.passwordSet,
                    imgPath: ''
                });
                const dto: SignInDTO = {
                    auth: {
                        usernameOrEmail: createdUser.username,
                        password: user.passwordSet.password
                    }
                };
                await runSignInTest(
                    dto,
                    HttpStatus.UNAUTHORIZED,
                    "Error: email isn't confirmed. A new confirmation email has been sent"
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.passwordResetting + ' PUT', function () {
        // --- Test --------------------
        let resetToken: string;

        beforeEach(async () => {
            const [createdUser] = await authService.signUp(user);
            resetToken = await authService.sendResetPasswordToken(user.email);
            sampleUser = await UserService.extractUserPublic(createdUser);
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runConfirmTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully set a new password`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'passwordResetting');
            return runTest('put', url, dto, status, message);
        };

        it(
            'should set a new password',
            async () => {
                const dto: ResetPasswordDTO = {
                    auth: {
                        token: resetToken,
                        passwordSet: {
                            // eslint-disable-next-line sonarjs/no-duplicate-string
                            password: 'Us25mmsv200#',
                            passwordConfirm: 'Us25mmsv200#'
                        }
                    }
                };
                await runConfirmTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't set a new password because of the bad request",
            async () => {
                const dto: any = { auth: { wrongField: 'somedata' } };
                await runConfirmTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't set a new password because of the passwords-don't-match error",
            async () => {
                const dto: ResetPasswordDTO = {
                    auth: {
                        token: resetToken,
                        passwordSet: {
                            password: 'Us25mmsv200#',
                            passwordConfirm: 'Us25mmsv200#$'
                        }
                    }
                };
                await runConfirmTest(
                    dto,
                    HttpStatus.UNAUTHORIZED,
                    "Error: passwords don't match"
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.passwordResetRequest + ' GET', function () {
        beforeEach(async () => {
            const [createdUser] = await authService.signUp(user);
            sampleUser = await UserService.extractUserPublic(createdUser);
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runConfirmTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully sent a link for password resetting`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'passwordResetRequest');
            return runTest('get', url, dto, status, message);
        };

        it(
            'should send a link for password resetting',
            async () => {
                const dto: RequestPasswordResetDTO = {
                    auth: { email: sampleUser.email }
                };
                await runConfirmTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't send a link for password resetting because of bad request",
            async () => {
                const dto: any = {
                    auth: { wrongField: sampleUser.email }
                };
                await runConfirmTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't confirm the user email because of the wrong email provided",
            async () => {
                const dto: RequestPasswordResetDTO = {
                    auth: { email: 'wrongemail@gmail.com' }
                };
                await runConfirmTest(
                    dto,
                    HttpStatus.NOT_FOUND,
                    "Error: user with specified data isn't found"
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.emailConfirmation + ' PUT', function () {
        // --- Test --------------------
        let confirmationToken: string;

        beforeEach(async () => {
            const [createdUser, token = confirmationToken] =
                await authService.signUp(user);
            sampleUser = await UserService.extractUserPublic(createdUser);
            confirmationToken = token;
            logger.debug(sampleUser);
        }, SpecsConfig.specs.getHookTimeoutMs());

        const runConfirmTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully confirmed the user`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'emailConfirmation');
            return runTest('put', url, dto, status, message);
        };

        it(
            'should confirm the user email',
            async () => {
                const dto: ConfirmationTokenDTO = {
                    auth: { token: confirmationToken }
                };
                await runConfirmTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't confirm the user email because of bad request",
            async () => {
                const dto: any = {
                    auth: { wrongField: confirmationToken }
                };
                await runConfirmTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    'Error: property wrongField should not exist'
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't confirm the user email because of the wrong token provided",
            async () => {
                const dto: ConfirmationTokenDTO = {
                    auth: { token: 'wrongToken' }
                };
                await runConfirmTest(
                    dto,
                    HttpStatus.FORBIDDEN,
                    'Error: invalid token'
                );
            },
            specs.getHookTimeoutMs()
        );
    });

    describe(Route.auth.signup + ' POST', function () {
        const runSignUpTest = <T extends object>(
            dto: T,
            status: HttpStatus = HttpStatus.CREATED,
            message = `Successfully signed up a new user`
        ): Promise<void> => {
            const url: string = getRoute(Route.auth, 'signup');
            return runTest('post', url, dto, status, message);
        };

        it(
            'should sign up a new user',
            async () => {
                const dto: SignUpDTO = {
                    auth: {
                        // eslint-disable-next-line sonarjs/no-duplicate-string
                        email: 'sample@email.com',
                        username: 'sample',
                        imgPath: null,
                        passwordSet: {
                            // eslint-disable-next-line sonarjs/no-duplicate-string
                            password: 'Us24mmsv200#',
                            passwordConfirm: 'Us24mmsv200#'
                        }
                    }
                };
                await runSignUpTest(dto);
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign up a new user because of missing username",
            async () => {
                const dto = {
                    auth: {
                        email: 'sample@email.com',
                        imgPath: null,
                        passwordSet: {
                            password: 'Us24mmsv200#',
                            passwordConfirm: 'Us24mmsv200#'
                        }
                    }
                };
                await runSignUpTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    'Error: username' + Format.username.errorMessage
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign up a new user because of passwords-don't-match error",
            async () => {
                const dto = {
                    auth: {
                        email: 'sample@email.com',
                        username: 'sample',
                        imgPath: null,
                        passwordSet: {
                            password: 'Us24mmsv200#',
                            passwordConfirm: 'Us24mmsv200$'
                        }
                    }
                };
                await runSignUpTest(
                    dto,
                    HttpStatus.BAD_REQUEST,
                    "Error: passwords don't match"
                );
            },
            specs.getHookTimeoutMs()
        );

        it(
            "shouldn't sign up a new user because of duplicate record",
            async () => {
                const dto: SignUpDTO = {
                    auth: {
                        email: 'sample@email.com',
                        username: 'sample',
                        imgPath: null,
                        passwordSet: {
                            password: 'Us24mmsv200#',
                            passwordConfirm: 'Us24mmsv200#'
                        }
                    }
                };

                await userService.create(dto.auth);
                await runSignUpTest(
                    dto,
                    HttpStatus.CONFLICT,
                    'Error: user with specified credentials already exists'
                );
            },
            specs.getHookTimeoutMs()
        );
    });
});
