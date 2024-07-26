import { IncomingHttpHeaders } from 'http';
import { v4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import {
    ConsoleLogger,
    ForbiddenException,
    forwardRef,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { isNil, isUndefined } from '@nestjs/common/utils/shared.utils';

import {
    IAccessPayload,
    IAccessToken,
    IAuthCredentials,
    IAuthResult,
    IEmailPayload,
    IEmailToken,
    IEnvConfig,
    IJwtConfig,
    IRefreshPayload,
    IRefreshToken,
    ISession,
    IUser,
    IUserCreate,
    IUserPublic,
    TokenTypeEnum
} from '#shared/types/interfaces';
import { IDatabaseConfig, IEmailConfig } from '#/types/interfaces';
import { IConfig, PublicTemplates } from '#/types';
import {
    LoggerService,
    MailerService,
    ReadParamEnum,
    UserService
} from '#/services';
import { UserRepository } from '#/repositories';

interface IAuthService {
    signUp(data: IUserCreate, domain?: string): Promise<[IUser, string]>;

    sendResetPasswordToken(email: string, domain?: string): Promise<string>;

    resetPassword(
        password: string,
        passwordConfirm: string,
        token: string
    ): Promise<void>;

    signIn(data: IAuthCredentials, domain?: string): Promise<IAuthResult>;

    refreshTokenAccess(refreshToken: string): Promise<ISession>;

    signOut(refreshToken: string): Promise<void>;

    get getCacheManager(): Cache;
}

@Injectable()
class AuthService implements IAuthService {
    // --- Configs -------------------------------------------------------------
    private readonly _jwt: IJwtConfig;
    private readonly _env: IEnvConfig;
    private readonly _email: IEmailConfig;
    private readonly _database: IDatabaseConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: LoggerService = new LoggerService(
        AuthService.name
    );

    // --- Constructor -------------------------------------------------------------
    constructor(
        private readonly _configService: ConfigService<IConfig>,
        @Inject(CACHE_MANAGER)
        private readonly _cacheManager: Cache,
        @Inject(JwtService)
        private readonly _jwtService: JwtService,
        @Inject(forwardRef(() => MailerService))
        private readonly _mailerService: MailerService,
        @Inject(forwardRef(() => UserService))
        private readonly _userService,
        @Inject(UserRepository)
        private readonly _userRepository: UserRepository
    ) {
        this._logger.log('Initializing an Auth service...');

        this._jwt = _configService.getOrThrow('jwt');
        this._env = _configService.getOrThrow('env');
        this._email = _configService.getOrThrow('email');
        this._database = _configService.getOrThrow('database');
    }

    // --- Static -------------------------------------------------------------

    // --- Private --------------------

    //--- _signToken -----------
    private static _signToken(
        payload: IAccessPayload | IEmailPayload | IRefreshPayload,
        secret: string,
        options: JwtSignOptions,
        logger: ConsoleLogger
    ): string {
        logger.log('Signing a new token...');
        logger.debug({ payload, secret, options });

        return jwt.sign(payload, secret, options);
    }

    // --- Public --------------------

    //--- verifyToken -----------
    public static verifyToken<
        T extends IAccessToken | IRefreshToken | IEmailToken
    >(
        token: string,
        secretOrPublicKey: string,
        options: JwtVerifyOptions,
        logger: LoggerService
    ): T {
        logger.log('Verifying the token...');
        logger.debug({ token, secretOrPublicKey, options });

        try {
            const payload: T = jwt.verify(
                token,
                secretOrPublicKey,
                options
            ) as T;
            logger.debug({ payload });
            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                throw new ForbiddenException('token expired');
            if (error instanceof jwt.JsonWebTokenError)
                throw new ForbiddenException('invalid token');
            throw new InternalServerErrorException(error);
        }
    }

    //--- extractRefreshToken -----------
    public static extractAccessToken(headers: IncomingHttpHeaders): string {
        const { authorization } = headers || {};
        if (!authorization)
            throw new ForbiddenException("access token isn't provided");
        return authorization.slice('Bearer '.length);
    }

    // --- Getters -------------------------------------------------------------

    get getCacheManager(): Cache {
        return this._cacheManager;
    }

    // --- Instance -------------------------------------------------------------

    // --- Public --------------------

    //--- signUp -----------
    public async signUp(
        data: IUserCreate,
        domain?: string
    ): Promise<[IUser, string]> {
        this._logger.log('Signing up a new user...');
        this._logger.debug({ data, domain });

        const userId: number = await this._userService.create(data);
        const [user]: IUser[] = await this._userService.read(
            ReadParamEnum.UserId,
            { userId },
            true
        );
        const confirmationToken: string = this._generateToken(
            user,
            TokenTypeEnum.CONFIRMATION,
            domain
        );

        await this._mailerService.sendEmail(
            user,
            confirmationToken,
            PublicTemplates.EmailConfirmation
        );

        this._logger.debug({ user, confirmationToken });
        return [user, confirmationToken];
    }

    //--- confirmEmail -----------
    public async confirmEmail(token: string): Promise<void> {
        this._logger.log('Confirming the user...');
        this._logger.debug({ token });

        const { uuid } = this._verifyToken<IAccessToken>(
            token,
            TokenTypeEnum.CONFIRMATION
        );

        const [user]: IUser[] = await this._userService.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        user.credentials.confirmed = true;

        await this._userRepository.update({ uuid }, user);

        this._logger.debug({ uuid, user });
    }

    //--- sendResetPasswordToken -----------
    public async sendResetPasswordToken(
        email: string,
        domain?: string
    ): Promise<string> {
        this._logger.log('Sending a link for password resetting...');
        this._logger.debug({ email, domain });

        const [user]: IUser[] = await this._userService.read(
            ReadParamEnum.Email,
            { email },
            true
        );

        const resetToken = this._generateToken(
            user,
            TokenTypeEnum.RESET_PASSWORD
        );

        this._logger.debug({ user, resetToken });

        await this._mailerService.sendEmail(
            user,
            resetToken,
            PublicTemplates.PasswordResetting
        );

        return resetToken;
    }

    //--- resetPassword -----------
    public async resetPassword(
        password: string,
        passwordConfirm: string,
        token: string
    ): Promise<void> {
        this._logger.log('Setting a new password...');
        this._logger.debug({ password, passwordConfirm, token });

        const { uuid } = await this._verifyToken<IEmailToken>(
            token,
            TokenTypeEnum.RESET_PASSWORD
        );

        UserService.checkPassword(
            password,
            passwordConfirm,
            true,
            true,
            this._database.passwordSecret,
            this._logger
        );

        await this._userService.update({
            uuid,
            passwordSet: { password, passwordConfirm }
        });
    }

    //--- singIn -----------
    public async signIn(
        data: IAuthCredentials,
        domain?: string
    ): Promise<IAuthResult> {
        const { usernameOrEmail, password } = data;

        this._logger.log('Signing in the user...');
        this._logger.debug({ data, domain });

        let user: IUser;
        if (usernameOrEmail.includes('@')) {
            [user] = await this._userService.read(
                ReadParamEnum.Email,
                { email: usernameOrEmail },
                true
            );
        } else {
            [user] = await this._userService.read(
                ReadParamEnum.Username,
                { username: usernameOrEmail },
                true
            );
        }

        UserService.checkPassword(
            user,
            password,
            false,
            true,
            this._database.passwordSecret,
            this._logger
        );

        if (!user.credentials.confirmed) {
            const confirmationToken: string = this._generateToken(
                user,
                TokenTypeEnum.CONFIRMATION,
                domain
            );
            await this._mailerService.sendEmail(
                user,
                confirmationToken,
                PublicTemplates.EmailConfirmation
            );
            throw new UnauthorizedException(
                "email isn't confirmed. A new confirmation email has been sent"
            );
        }

        const [accessToken, refreshToken] = this._generateAuthTokens(
            user,
            domain
        );
        this._logger.debug({ user, accessToken, refreshToken });

        const userPublic: IUserPublic = UserService.extractUserPublic(user);

        return { user: userPublic, session: { accessToken, refreshToken } };
    }

    //--- refreshTokenAccess -----------
    public async refreshTokenAccess(refreshToken: string): Promise<ISession> {
        const { uuid, token } = this._verifyToken<IRefreshToken>(
            refreshToken,
            TokenTypeEnum.REFRESH
        );

        this._logger.log('Refreshing token access...');
        this._logger.debug({ uuid, token });

        await this._checkTokenBlacklisted(uuid, token);
        const [user] = await this._userService.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        const [newAccessToken, newRefreshToken]: [string, string] =
            this._generateAuthTokens(user, TokenTypeEnum.REFRESH);

        this._logger.debug({
            user,
            accessToken: newAccessToken,
            newRefreshToken
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    //--- signOut -----------
    public async signOut(refreshToken: string): Promise<void> {
        this._logger.log('Signing out the user...');

        const { uuid, token, exp } = this._verifyToken<IRefreshToken>(
            refreshToken,
            TokenTypeEnum.REFRESH
        );

        this._logger.debug({ uuid, token, refreshToken });

        await this._blacklistToken(uuid, token, exp);
    }

    // --- Private ------------------------------------------------------------

    //--- _generateToken -----------
    private _generateToken(
        user: IUser,
        tokenType: TokenTypeEnum,
        token?: string
    ): string {
        const jwtOptions: JwtSignOptions = {
            algorithm: 'HS256',
            issuer: this._env.appId,
            audience: this._env.frontEndOrigin,
            subject: this._email.credentials.username
        };

        this._logger.log('Generating new tokens...');
        this._logger.debug({ user, tokenType, token, jwtOptions });

        switch (tokenType) {
            case TokenTypeEnum.ACCESS:
                const { privateKey, timeMs: accessTime } =
                    this._jwt.tokens.access;
                return AuthService._signToken(
                    { uuid: user.uuid, username: user.username },
                    privateKey,
                    {
                        ...jwtOptions,
                        expiresIn: accessTime,
                        algorithm: 'RS256'
                    },
                    this._logger
                );
            case TokenTypeEnum.REFRESH:
                const { secret: refreshSecret, timeMs: refreshTime } =
                    this._jwt.tokens.refresh;
                return AuthService._signToken(
                    {
                        uuid: user.uuid,
                        username: user.username,
                        version: user.credentials.version,
                        token: token ?? v4()
                    },
                    refreshSecret,
                    { ...jwtOptions, expiresIn: refreshTime },
                    this._logger
                );
            case TokenTypeEnum.CONFIRMATION:
            case TokenTypeEnum.RESET_PASSWORD:
                const { secret, timeMs } = this._jwt.tokens[tokenType];
                return AuthService._signToken(
                    {
                        uuid: user.uuid,
                        username: user.username,
                        version: user.credentials.version
                    },
                    secret,
                    { ...jwtOptions, expiresIn: timeMs },
                    this._logger
                );
        }
    }

    //--- _generateAuthTokens -----------
    private _generateAuthTokens(user: IUser, token?: string): [string, string] {
        this._logger.log('Generating auth tokens...');
        this._logger.debug({ user, token });
        return [
            this._generateToken(user, TokenTypeEnum.ACCESS, token),
            this._generateToken(user, TokenTypeEnum.REFRESH, token)
        ];
    }

    //--- _blacklistToken -----------
    private async _blacklistToken(
        uuid: string,
        token: string,
        exp: number
    ): Promise<void> {
        const now: number = Date.now();
        const ttl: number = exp - now;

        this._logger.log('Blacklisting the token...');
        this._logger.debug({ now, ttl });

        if (ttl > 0) {
            await this._cacheManager.set(
                `blacklist:${uuid}:${token}`,
                now,
                ttl
            );
        }
    }

    //--- _checkTokenBlacklisted -----------
    private async _checkTokenBlacklisted(
        uuid: string,
        tokenId: string
    ): Promise<void> {
        this._logger.log('Checking if the token is blacklisted...');
        this._logger.debug({ uuid, tokenId });

        const time: number | undefined = await this._cacheManager.get<number>(
            `blacklist:${uuid}:${tokenId}`
        );

        this._logger.debug({ time });

        if (!isUndefined(time) && !isNil(time))
            throw new UnauthorizedException('invalid token');
    }

    //--- _verifyToken -----------
    private _verifyToken<T extends IAccessToken | IRefreshToken | IEmailToken>(
        token: string,
        tokenType: TokenTypeEnum
    ): T {
        const jwtOptions: jwt.VerifyOptions = {
            issuer: this._env.appId,
            audience: this._env.frontEndOrigin
        };

        this._logger.log('Verifying the token...');
        this._logger.debug({ token, tokenType, jwtOptions });

        switch (tokenType) {
            case TokenTypeEnum.ACCESS:
                const { publicKey, timeMs: accessTime } =
                    this._jwt.tokens.access;

                this._logger.debug({ publicKey, accessTime });

                return AuthService.verifyToken(
                    token,
                    publicKey,
                    {
                        ...jwtOptions,
                        maxAge: accessTime,
                        algorithms: ['RS256']
                    },
                    this._logger
                );
            case TokenTypeEnum.REFRESH:
            case TokenTypeEnum.CONFIRMATION:
            case TokenTypeEnum.RESET_PASSWORD:
                const { secret, timeMs } = this._jwt.tokens[tokenType];

                this._logger.debug({ secret, timeMs });

                return AuthService.verifyToken(
                    token,
                    secret,
                    {
                        ...jwtOptions,
                        maxAge: timeMs,
                        algorithms: ['HS256']
                    },
                    this._logger
                );
        }
    }
}

export { AuthService };
