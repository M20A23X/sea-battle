import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { IAuthConfig } from '#shared/types';
import { checkAccess } from '#shared/utils';
import { Default as DefaultShared } from '#shared/static';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly _auth: IAuthConfig['auth'] = DefaultShared.auth;

    constructor(
        @Inject(JwtService)
        private readonly _jwtService: JwtService,
        @Inject(ConfigService)
        private readonly _configService: ConfigService<IAuthConfig>
    ) {
        this._auth = this._configService.getOrThrow('auth');
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        return checkAccess(
            this._auth.jwtSecret,
            this._jwtService.verifyAsync,
            context,
            this._auth.jwtAlgorithm
        );
    }
}
