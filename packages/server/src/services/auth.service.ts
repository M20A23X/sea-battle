import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryError } from 'mysql2';

import { IUser, IUserPublicData } from 'shared/types/user';
import {
    ServiceCode,
    ServicePromiseRes,
    ServiceRes,
} from 'shared/types/requestResponse';
import { IRefreshToken, TRefreshJwtRes, TSignInRes } from 'shared/types/auth';

import { requireGetServiceRes } from 'shared/utils/res.util';

import { ILoggerService, LoggerService } from './logger.service';
import { IUsersService, UsersService } from './users.service';

import { decipherError } from 'utils/decipherError.util';
import { createRefreshToken, signJwtToken } from 'utils/auth.util';

import { User } from 'modules/user/models/entities/user.entity';

import {
    IRefreshTokenRepository,
    RefreshTokenRepository,
} from 'repositories/refreshToken.repository';

interface IAuthService {
    signIn(
        username: string,
        password: string,
        accessIpv6: string,
    ): ServicePromiseRes<TSignInRes>;
    refreshJwtToken(
        token: string,
        accessIpv6: string,
    ): ServicePromiseRes<TRefreshJwtRes>;
}

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        @Inject(JwtService)
        private _jwtService: JwtService,
        @Inject(UsersService)
        private _usersService: IUsersService,
        @Inject(RefreshTokenRepository)
        private _refreshTokenRepository: IRefreshTokenRepository,
    ) {}

    ///--- Private ---///
    private readonly _entityName: string = User.name;
    private readonly _loggerService: ILoggerService = new LoggerService(
        UsersService.name,
    );
    private readonly _requireGetRes = requireGetServiceRes(
        decipherError,
        this._entityName,
        this._loggerService,
    );

    ///--- Public ---///
    public async signIn(
        username: string,
        password: string,
        accessIpv6: string,
    ): ServicePromiseRes<TSignInRes> {
        const getRes = this._requireGetRes('SIGN_IN');
        const readRes: ServiceRes<IUser[]> = await this._usersService.readUsers(
            username,
            true,
            true,
        );
        const [user]: IUser[] = readRes.payload || [];
        if (!user || !readRes.isSuccess) {
            return getRes({
                serviceCode: readRes.serviceCode,
                messageRaw: { username },
            });
        }

        const passwordCheckRes: ServiceRes<boolean> =
            await this._usersService.checkPassword(user, password);
        if (!passwordCheckRes.isSuccess) {
            return getRes({
                serviceCode: passwordCheckRes.serviceCode,
                messageRaw: { username },
            });
        }

        const { password: _, userId, ...userPublicData } = user;
        const refreshTokenUnused: IRefreshToken = {
            userId,
            accessIpv6: accessIpv6,
            ...createRefreshToken(),
        };
        let refreshToken: string;
        try {
            await this._refreshTokenRepository.insertToken(refreshTokenUnused);
            refreshToken = refreshTokenUnused.token;
        } catch (error: unknown) {
            if (error instanceof Error) {
                const errorCode: ServiceCode = (error as QueryError)
                    .code as ServiceCode;
                if (errorCode !== 'ER_DUP_ENTRY')
                    return getRes({ error, messageRaw: { username } });
            }

            const errMsg: string = `Skipping create new refresh token`.concat(
                decipherError(this._entityName, this._loggerService, { error }),
            );
            this._loggerService.warn(errMsg);

            const readTokenRes: IRefreshToken =
                await this._refreshTokenRepository.readToken(user.userId);
            refreshToken = readTokenRes[0].token;
        }

        const signInPayload: TSignInRes = {
            user: userPublicData,
            accessToken: await signJwtToken(this._jwtService, userId, username),
            refreshToken,
        };
        return getRes({ messageRaw: { username }, payload: signInPayload });
    }

    public async refreshJwtToken(
        token: string,
        accessIpv6: string,
    ): ServicePromiseRes<TRefreshJwtRes> {
        const getRes = this._requireGetRes('REFRESH');

        try {
            const readTokenRes: IRefreshToken | null =
                await this._refreshTokenRepository.readToken(token);
            if (!readTokenRes?.[0]?.token) {
                return getRes({
                    serviceCode: 'UNAUTHORIZED',
                    messageRaw:
                        'no session found for this token - please, sign in first',
                });
            }

            const {
                token: readToken,
                userId,
                accessIpv6: lastAccessIp,
                expirationDateTime,
            } = readTokenRes[0];
            if (accessIpv6 !== lastAccessIp) {
                return getRes({
                    serviceCode: 'UNAUTHORIZED',
                    messageRaw: 'ip change detected - please, sing in again',
                });
            }

            if (new Date(expirationDateTime).getTime() < new Date().getTime()) {
                await this._refreshTokenRepository.deleteToken(readToken);
                return getRes({
                    serviceCode: 'UNAUTHORIZED',
                    messageRaw: 'session expired - please, sign in again',
                });
            }

            const readRes: ServiceRes<IUserPublicData[]> =
                await this._usersService.readUsers(
                    { startId: userId, endId: userId },
                    false,
                );
            const [user]: IUserPublicData[] = readRes.payload || [];
            if (!user || !readRes.isSuccess)
                return getRes({ serviceCode: readRes.serviceCode });

            const accessToken: string = await signJwtToken(
                this._jwtService,
                userId,
                user.username,
            );

            return getRes({ payload: { accessToken } });
        } catch (error: unknown) {
            return getRes({ error });
        }
    }
}
