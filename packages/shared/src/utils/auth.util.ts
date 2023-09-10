import process from 'process';

import { Request } from 'express';
import { Algorithm } from 'jsonwebtoken';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EnvError } from '../exceptions/EnvError';
import { JWT_ALGORITHM } from 'static/common';

const extractToken = (request: Request): string | undefined => {
    const [type, token]: string[] =
        request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
};

const checkAccess = async (
    verifyAsyncJwt: JwtService['verifyAsync'],
    context: ExecutionContext,
): Promise<boolean> => {
    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) throw new EnvError('JWT secret is not set!');

    const request = context.switchToHttp().getRequest();
    const token: string | undefined = extractToken(request);
    if (!token) return false;

    try {
        request.user = await Function.prototype.call(verifyAsyncJwt, token, {
            secret: jwtSecret,
            algorithms: [
                (process.env.JWT_ALGORITHM as Algorithm) || JWT_ALGORITHM,
            ],
        });
    } catch {
        return false;
    }
    return true;
};

export { checkAccess };
