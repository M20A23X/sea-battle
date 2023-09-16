import { v4 } from 'uuid';

import { RefreshTokenRaw } from '#shared/types';

import { REFRESH_TOKEN_EXPIRE_TIME_MS } from '#shared/static';

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
