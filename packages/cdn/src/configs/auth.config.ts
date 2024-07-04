import { Algorithm } from 'jsonwebtoken';

import { IAuthConfig } from '#shared/types';
import { Default as DefaultShared } from '#shared/static';

export default (): IAuthConfig => ({
    auth: {
        jwtSecret: process.env.JWT_SECRET || '',
        jwtAlgorithm:
            (process.env.JWT_ALGORITHM as Algorithm) ||
            DefaultShared.auth.jwtAlgorithm,
        jwtExpireTimeS: parseInt(
            process.env.JWT_EXPIRE_TIME_S ||
                '' + DefaultShared.auth.jwtExpireTimeS
        ),
        refreshTokenExpireTimeS: parseInt(
            process.env.REFRESH_TOKEN_EXPIRE_TIME_S ||
                '' + DefaultShared.auth.refreshTokenExpireTimeS
        )
    }
});
