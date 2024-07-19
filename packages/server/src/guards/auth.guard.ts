import * as jwt from 'jsonwebtoken';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
    IEnvConfig,
    IJwtConfig,
    TokenTypeEnum
} from '#shared/types/interfaces';
import { IConfig } from '#/types';
import { AuthService, LoggerService } from '#/services';

@Injectable()
class AuthGuard implements CanActivate {
    // --- Configs -------------------------------------------------------------
    private readonly _jwt: IJwtConfig;
    private readonly _env: IEnvConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: LoggerService = new LoggerService(AuthGuard.name);

    // --- Constructor -------------------------------------------------------------
    constructor(private readonly _configService: ConfigService<IConfig>) {
        this._env = this._configService.getOrThrow('env');
        this._jwt = this._configService.getOrThrow('jwt');
    }

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------
    //--- canActivate -----------
    public canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const token: string = AuthService.extractAccessToken(req.headers);
        const jwtOptions: jwt.VerifyOptions = {
            algorithms: ['RS256'],
            issuer: this._env.appId,
            audience: this._env.frontEndOrigin
        };

        AuthService.verifyToken(
            token,
            this._jwt.tokens[TokenTypeEnum.ACCESS].publicKey,
            jwtOptions,
            this._logger
        );

        return true;
    }
}

export { AuthGuard };
