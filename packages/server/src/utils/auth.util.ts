import process from 'process';
import { v4 } from 'uuid';

import { RefreshTokenRaw } from 'shared/types/auth';

import { REFRESH_TOKEN_EXPIRE_TIME_MS } from 'shared/static/common';

const createRefreshToken = (): RefreshTokenRaw => {
    const jwtRefreshExpireTime =
        parseInt(process.env.JWT_REFRESH_EXPIRE_TIME || '') ||
        REFRESH_TOKEN_EXPIRE_TIME_MS;
    const expirationDateTime: Date = new Date(
        new Date().getTime() + jwtRefreshExpireTime
    );
    return {
        token: v4(),
        expirationDateTime
    };
};

export { createRefreshToken };
