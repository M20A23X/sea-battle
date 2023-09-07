import process from 'process';
import { v4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';

import { TRefreshTokenRaw } from 'shared/types/auth';

import { REFRESH_TOKEN_EXPIRE_TIME_MS } from 'static/common';

const createRefreshToken = (): TRefreshTokenRaw => {
    const jwtRefreshExpireTime =
        parseInt(process.env.JWT_REFRESH_EXPIRE_TIME || '') ||
        REFRESH_TOKEN_EXPIRE_TIME_MS;
    const expirationDateTime: Date = new Date(
        new Date().getTime() + jwtRefreshExpireTime,
    );
    return {
        token: v4(),
        expirationDateTime,
    };
};

const signJwtToken = async (
    jwtService: JwtService,
    userId: number,
    username: string,
): Promise<string> => await jwtService.signAsync({ userId, username });

export { createRefreshToken, signJwtToken };
