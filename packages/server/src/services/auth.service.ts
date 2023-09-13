import process from 'process';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PromiseRes, Res, ServiceCode } from 'shared/types/requestResponse';
import { IRefreshToken, AccessTokenRes, SignInRes } from 'shared/types/auth';
import { IUser, UserPublicData } from 'shared/types/user';

import { decipherCode } from 'shared/utils/decipherError.util';
import {
    getServiceCode,
    GetUnSuccessRes,
    requireGetRes
} from 'shared/utils/requestResponse.util';
import { signJwtToken } from 'shared/utils/auth.util';

import { ILoggerService, LoggerService } from './logger.service';
import { IUserService, UserService } from './user.service';

import { createRefreshToken } from 'utils/auth.util';

import { User } from 'modules/user/models/entities/user.entity';

import {
    IRefreshTokenRepository,
    RefreshTokenRepository
} from 'repositories/refreshToken.repository';

export interface IAuthService {
    signIn(
        username: string,
        password: string,
        accessIpv6: string
    ): PromiseRes<SignInRes>;
    refreshAccessToken(
        token: string | undefined,
        accessIpv6: string
    ): PromiseRes<AccessTokenRes>;
}

@Injectable()
export class AuthService implements IAuthService {
    constructor(
        @Inject(JwtService)
        private _jwtService: JwtService,
        @Inject(UserService)
        private _usersService: IUserService,
        @Inject(RefreshTokenRepository)
        private _refreshTokenRepository: IRefreshTokenRepository
    ) {}

    ///--- Private ---///
    private readonly _loggerService: ILoggerService = new LoggerService(
        UserService.name
    );
    private readonly _getRes = requireGetRes(AuthService.name);

    private async _deleteExpiredToken(
        token: string,
        getUnSuccessRes: GetUnSuccessRes
    ) {
        try {
            await this._refreshTokenRepository.deleteToken(token);
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode);
        }
    }

    ///--- Public ---///
    public async signIn(
        username: string,
        password: string,
        accessIpv6: string
    ): PromiseRes<SignInRes> {
        const [getSuccessRes, getUnSuccessRes] = this._getRes(
            'SIGN_IN',
            User.name
        );

        const readRes: Res<IUser[]> = await this._usersService.readUsers(
            username,
            true,
            true
        );
        const [user]: IUser[] = readRes.payload || [];
        const { userUUID: uuid } = user;

        const checkPasswordRes: boolean =
            await this._usersService.checkPassword(user, password);
        if (!checkPasswordRes)
            throw getUnSuccessRes('PASSWORDS_DONT_MATCH', { username });

        const { password: _, userId, ...userPublicData } = user;
        const refreshTokenUnused: IRefreshToken = {
            userId,
            accessIpv6: accessIpv6,
            ...createRefreshToken()
        };

        let refreshToken: string | undefined;
        try {
            await this._refreshTokenRepository.insertToken(refreshTokenUnused);
            refreshToken = refreshTokenUnused.token;
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (serviceCode !== 'ER_DUP_ENTRY') throw error;

            const decipheredCode: string = decipherCode(
                User.name,
                'ER_DUP_ENTRY',
                { user: uuid }
            );
            const errMsg = `Skipping create new refresh token: ${decipheredCode}`;
            this._loggerService.warn(errMsg);

            let readResRaw: any;
            try {
                readResRaw = await this._refreshTokenRepository.readToken(
                    user.userId
                );
            } catch (error: unknown) {
                const serviceCode: ServiceCode | undefined =
                    getServiceCode(error);
                if (!serviceCode) throw error;
                throw getUnSuccessRes(serviceCode);
            }

            const isCorrect: boolean =
                typeof readResRaw?.[0]?.token === 'string';
            if (!isCorrect) throw getUnSuccessRes('UNEXPECTED_DB_ERROR');
            refreshToken = (readResRaw as IRefreshToken[])?.[0]?.token;
        }

        if (typeof refreshToken !== 'string')
            throw getUnSuccessRes('UNEXPECTED_DB_ERROR');

        const signInPayload: SignInRes = {
            user: userPublicData,
            accessToken: await signJwtToken(
                this._jwtService,
                process.env.JWT_SECRET || '',
                userId,
                username
            ),
            refreshToken
        };
        return getSuccessRes({ username }, signInPayload);
    }

    public async refreshAccessToken(
        token: string | undefined,
        accessIpv6: string
    ): PromiseRes<AccessTokenRes> {
        const [getSuccessRes, getUnSuccessRes] = this._getRes(
            'REFRESH',
            'access token'
        );

        if (!token) throw getUnSuccessRes('NO_TOKEN');

        let readResRaw: any;
        try {
            readResRaw = await this._refreshTokenRepository.readToken(token);
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode);
        }

        const isArray: boolean = readResRaw instanceof Array;
        if (!isArray) throw getUnSuccessRes('UNEXPECTED_DB_ERROR');
        let readTokenRes = readResRaw as any[];

        if (!readTokenRes.length) throw getUnSuccessRes('NO_SESSION');

        const isCorrect: boolean = typeof readResRaw?.[0]?.token === 'string';
        if (!isCorrect) throw getUnSuccessRes('UNEXPECTED_DB_ERROR');
        readTokenRes = readResRaw as IRefreshToken[];

        const {
            token: readToken,
            userId,
            accessIpv6: lastAccessIp,
            expirationDateTime
        } = readTokenRes[0];

        if (accessIpv6 !== lastAccessIp) throw getUnSuccessRes('IP_CHANGED');

        if (new Date(expirationDateTime).getTime() < new Date().getTime()) {
            await this._deleteExpiredToken(readToken, getUnSuccessRes);
            throw getUnSuccessRes('SESSION_EXPIRED');
        }

        const readUsersRes: Res<UserPublicData[]> =
            await this._usersService.readUsers(
                { startId: userId, endId: userId },
                false
            );
        if (!readUsersRes.payload?.length)
            throw getUnSuccessRes('UNEXPECTED_DB_ERROR');

        const accessToken: string = await signJwtToken(
            this._jwtService,
            process.env.JWT_SECRET || '',
            userId,
            readUsersRes.payload[0].username
        );

        return getSuccessRes(undefined, { accessToken }, 'access token');
    }
}
