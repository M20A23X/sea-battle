import { TokenTypeEnum } from '#shared/types/interfaces';
import { EnvException } from '#shared/exceptions';
import { getEnvFloat, getEnvString } from '#shared/utils';

import { IConfig } from '#/types';
import { Config } from '#/static';

export default (): Pick<IConfig, 'jwt'> => {
    const config: Pick<IConfig, 'jwt'> = {
        jwt: {
            tokens: {
                access: {
                    publicKey: getEnvString('SERVER_JWT_ACCESS_PUBLIC_KEY'),
                    privateKey: getEnvString('SERVER_JWT_ACCESS_PRIVATE_KEY'),
                    timeMs: getEnvFloat(
                        'SERVER_JWT_ACCESS_EXPIRATION_MS',
                        Config.jwt.tokens.access.timeMs
                    )
                },
                confirmation: {
                    secret: getEnvString('SERVER_JWT_CONFIRMATION_SECRET'),
                    timeMs: getEnvFloat(
                        'SERVER_JWT_CONFIRMATION_EXPIRATION_MS',
                        Config.jwt.tokens.confirmation.timeMs
                    )
                },
                resetPassword: {
                    secret: getEnvString('SERVER_JWT_RESET_PASSWORD_SECRET'),
                    timeMs: getEnvFloat(
                        'SERVER_JWT_RESET_PASSWORD_EXPIRATION_MS',
                        Config.jwt.tokens.resetPassword.timeMs
                    )
                },
                refresh: {
                    secret: getEnvString('SERVER_JWT_REFRESH_SECRET'),
                    timeMs: getEnvFloat(
                        'SERVER_JWT_REFRESH_EXPIRATION_MS',
                        Config.jwt.tokens.refresh.timeMs
                    )
                }
            }
        }
    };

    if (!config.jwt.tokens[TokenTypeEnum.ACCESS].publicKey)
        throw new EnvException(`The JWT access public key isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.ACCESS].privateKey)
        throw new EnvException(`The JWT access private key isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.CONFIRMATION].secret)
        throw new EnvException(`The JWT confirmation secret isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.RESET_PASSWORD].secret)
        throw new EnvException(`The JWT reset password secret isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.REFRESH].secret)
        throw new EnvException(`The JWT refresh secret isn't set`);

    return config;
};
