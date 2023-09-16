import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { checkAccess } from '#shared/utils';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject(JwtService)
        private _jwtService: JwtService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        return await checkAccess(this._jwtService.verifyAsync, context);
    }
}
