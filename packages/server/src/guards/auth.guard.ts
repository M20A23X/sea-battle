import process from 'process';
import { Request } from 'express';
import { Algorithm } from 'jsonwebtoken';
import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { JWT_ALGORITHM } from 'shared/static/common';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject(JwtService)
        private _jwtService: JwtService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token: string | undefined = this.extractToken(request);
        if (!token) return false;

        try {
            request.user = await this._jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
                algorithms: [
                    (process.env.JWT_ALGORITHM as Algorithm) || JWT_ALGORITHM,
                ],
            });
        } catch {
            return false;
        }
        return true;
    }

    private extractToken(request: Request): string | undefined {
        const [type, token]: string[] =
            request.headers?.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
