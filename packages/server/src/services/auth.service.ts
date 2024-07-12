import { IncomingHttpHeaders } from 'http';
import { v4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import {
    BadRequestException,
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
    TokenType
} from '#shared/types/interfaces';
import { ILoggerService, LoggerService, UserService } from '#/services';
import { IConfig } from '#/types';
import { MailerService } from '#/services/mailer.service';
import { IEmailConfig } from '#/types/interfaces';

interface IAuthService {
    signUp(data: IUserCreate, domain?: string): Promise<void>;
    resetPassword(email: string, domain?: string): Promise<void>;
    signIn(data: IAuthCredentials, domain?: string): Promise<IAuthResult>;
    refreshTokenAccess(refreshToken: string): Promise<ISession>;
    signOut(refreshToken: string): Promise<void>;
}

@Injectable()
class AuthService implements IAuthService {
    // --- Configs -------------------------------------------------------------
    private readonly _jwt: IJwtConfig;
    private readonly _env: IEnvConfig;
    private readonly _email: IEmailConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: ILoggerService = new LoggerService(
        AuthService.name
    );

    // --- Constructor -------------------------------------------------------------
    constructor(
        private readonly _configService: ConfigService<IConfig>,
        private readonly _mailerService: MailerService,
        @Inject(CACHE_MANAGER)
        private readonly _cacheManager: Cache,
        @Inject(JwtService)
        private readonly _jwtService: JwtService,

        @Inject(UserService)
        private readonly _usersService: UserService
    ) {
        this._jwt = _configService.getOrThrow('jwt');
        this._env = _configService.getOrThrow('env');
        this._email = _configService.getOrThrow('email');
    }

    // --- Public -------------------------------------------------------------

    // --- Static --------------------

    //--- verifyToken -----------
    public static verifyToken<T = IAccessToken | IRefreshToken | IEmailToken>(
        token: string,
        secret: string,
        options: JwtVerifyOptions,
        logger: ILoggerService
    ): T {
        logger.log('Signing up a new user...');
        logger.debug({ token, secret, options });

        try {
            const payload: T = jwt.verify(token, secret, options) as T;
            logger.debug(payload);
            return payload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError)
                throw new BadRequestException('Token expired');
            if (error instanceof jwt.JsonWebTokenError)
                throw new BadRequestException('Invalid token');
            throw new InternalServerErrorException(error);
        }
    }

    //--- extractRefreshToken -----------
    public static extractRefreshToken(headers: IncomingHttpHeaders): string {
        const { 'x-refresh-token': token } = headers || {};
        if (!token) throw new BadRequestException('no refresh token provided');
        return token;
    }

    // --- Instance --------------------

    //--- signUp -----------
    public async signUp(data: IUserCreate, domain?: string): Promise<void> {
        this._logger.log('Signing up a new user...');
        this._logger.debug({ data, domain });

        const userId: number = await this._usersService.create(data);
        const [user]: IUser[] = await this._usersService.read(
            'userId',
            { userId },
            true
        );
        const confirmationToken = this._generateToken(
            user,
            TokenType.CONFIRMATION,
            domain
        );

        await this._mailerService.sendEmailConfirmation(
            user,
            confirmationToken
        );

        this._logger.debug({ user, confirmationToken });
    }

    //--- resetPasswordEmail -----------
    public async resetPassword(email: string, domain?: string): Promise<void> {
        this._logger.log('Sending ...');
        this._logger.debug({ email, domain });

        const [user]: IUser[] = await this._usersService.read(
            'email',
            { email },
            true
        );

        const resetToken = AuthService._generateToken(
            user,
            TokenType.RESET_PASSWORD,
            { audience: domain }
        );

        this._logger.debug({ user, resetToken });

        await this._mailerService.sendResetPasswordEmail(user, resetToken);
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
            [user] = await this._usersService.read(
                'email',
                { email: usernameOrEmail },
                true
            );
        } else {
            [user] = await this._usersService.read(
                'username',
                { username: usernameOrEmail },
                true
            );
        }

        await UserService.checkPassword(user, password, this._logger);

        if (!user.credentials.confirmed) {
            const confirmationToken: string = this._generateToken(
                user,
                TokenType.CONFIRMATION,
                domain
            );
            await this._mailerService.sendEmailConfirmation(
                user,
                confirmationToken
            );
            throw new UnauthorizedException(
                'Please confirm your email, a new email has been sent'
            );
        }

        const [accessToken, refreshToken] = this._generateAuthTokens(
            user,
            domain
        );

        this._logger.debug({ user, accessToken, refreshToken });

        const userPublic: IUserPublic = {
            email: user.email,
            username: user.username,
            credentials: user.credentials,
            imgPath: user.imgPath,
            uuid: user.uuid
        };

        return { user: userPublic, session: { accessToken, refreshToken } };
    }

    //--- refreshTokenAccess -----------
    public async refreshTokenAccess(refreshToken: string): Promise<ISession> {
        const { userId, token } = this._verifyToken(
            refreshToken,
            TokenType.REFRESH
        );

        this._logger.log('Refreshing token access...');
        this._logger.debug({ userId, token });

        await this._checkTokenBlacklisted(userId, token);
        const [user] = await this._usersService.read(
            'userId',
            { userId },
            true
        );

        const [newAccessToken, newRefreshToken] = this._generateToken(
            user,
            token
        );

        this._logger.debug({
            user,
            accessToken: newAccessToken,
            newRefreshToken
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    //--- signOut -----------
    public async signOut(refreshToken: string): Promise<void> {
        const { userId, token, exp } = this._verifyToken<IRefreshToken>(
            refreshToken,
            TokenType.REFRESH
        );

        this._logger.log('Signing out the user...');
        this._logger.debug({ userId, token, refreshToken });

        await this._blacklistToken(userId, token, exp);
    }

    // --- Private ------------------------------------------------------------
    // --- Static --------------------
    private static _generateToken(
        payload: IAccessPayload | IEmailPayload | IRefreshPayload,
        secret: string,
        options: JwtSignOptions
    ): string {
        return jwt.sign(payload, secret, options);
    }

    // --- Instance --------------------
    //--- _generateToken -----------
    private _generateToken(
        user: IUser,
        tokenType: TokenType,
        token?: string
    ): string {
        const jwtOptions: JwtSignOptions = {
            algorithm: 'HS256',
            privateKey: this._jwt.tokens.access.privateKey,
            issuer: this._env.appId,
            audience: this._env.frontEndDomain,
            subject: this._email.credentials.username
        };

        this._logger.log('Generating new tokens...');
        this._logger.debug({ user, tokenType, token, jwtOptions });

        switch (tokenType) {
            case TokenType.ACCESS:
                const { privateKey, timeMs: accessTime } =
                    this._jwt.tokens.access;
                return AuthService._generateToken(
                    { userId: user.userId, username: user.username },
                    privateKey,
                    { ...jwtOptions, expiresIn: accessTime, algorithm: 'RS256' }
                );
            case TokenType.REFRESH:
                const { secret: refreshSecret, timeMs: refreshTime } =
                    this._jwt.tokens.refresh;
                return AuthService._generateToken(
                    {
                        userId: user.userId,
                        username: user.username,
                        version: user.credentials.version,
                        token: token ?? v4()
                    },
                    refreshSecret,
                    { ...jwtOptions, expiresIn: refreshTime }
                );

            case TokenType.CONFIRMATION:
            case TokenType.RESET_PASSWORD:
                const { secret, time } = this._jwt[tokenType];
                return AuthService._generateToken(
                    {
                        userId: user.userId,
                        username: user.username,
                        version: user.credentials.version
                    },
                    secret,
                    { ...jwtOptions, expiresIn: time }
                );
        }
    }

    //--- _generateAuthTokens -----------
    private _generateAuthTokens(user: IUser, token?: string): [string, string] {
        this._logger.log('Generating auth tokens...');
        this._logger.debug({ user, token });
        return [
            this._generateToken(user, TokenType.ACCESS, token),
            this._generateToken(user, TokenType.REFRESH, token)
        ];
    }

    //--- _blacklistToken -----------
    private async _blacklistToken(
        userId: number,
        token: string,
        exp: number
    ): Promise<void> {
        const now: number = Date.now();
        const ttl: number = exp - now;

        if (ttl > 0) {
            await this._cacheManager.set(
                `blacklist:${userId}:${token}`,
                now,
                ttl
            );
        }
    }

    //--- _checkTokenBlacklisted -----------
    private async _checkTokenBlacklisted(
        userId: number,
        tokenId: string
    ): Promise<void> {
        this._logger.log('Checking if the token is blacklisted...');
        this._logger.debug({ userId, tokenId });

        const time: number | undefined = await this._cacheManager.get<number>(
            `blacklist:${userId}:${tokenId}`
        );

        this._logger.debug({ time });

        if (!isUndefined(time) && !isNil(time))
            throw new UnauthorizedException('Invalid token');
    }

    //--- _verifyToken -----------
    private _verifyToken<T = IAccessToken | IRefreshToken | IEmailToken>(
        token: string,
        tokenType: TokenType
    ): T {
        const jwtOptions: jwt.VerifyOptions = {
            issuer: this._env.appId,
            audience: new RegExp(this._env.frontEndDomain)
        };

        this._logger.log('Verifying the token...');
        this._logger.debug({ token, tokenType, jwtOptions });

        switch (tokenType) {
            case TokenType.ACCESS:
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
            case TokenType.REFRESH:
            case TokenType.CONFIRMATION:
            case TokenType.RESET_PASSWORD:
                const { secret, time } = this._jwt[tokenType];

                this._logger.debug({ secret, time });

                return AuthService.verifyToken(
                    token,
                    secret,
                    {
                        ...jwtOptions,
                        maxAge: time,
                        algorithms: ['HS256']
                    },
                    this._logger
                );
        }
    }
}

export { IAuthService, AuthService };
