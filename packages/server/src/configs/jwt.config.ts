import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

import { IKeyPath, TokenTypeEnum } from '#shared/types/interfaces';
import { EnvException } from '#shared/exceptions';
import { getEnvFloat, getEnvString } from '#shared/utils';

import { IConfig } from '#/types';
import { Config } from '#/static';

const readKeyFile = (filePath: string) =>
    fs.readFileSync(path.join(process.cwd(), '..', '..', filePath), 'utf-8');

export default (): Pick<IConfig, 'jwt'> => {
    const keyPath: IKeyPath['keyPath'] = {
        public: getEnvString('JWT_PUBLIC_KEY_PATH', Config.jwt.keyPath.public),
        private: getEnvString(
            'JWT_PRIVATE_KEY_PATH',
            Config.jwt.keyPath.private
        )
    };

    const config: Pick<IConfig, 'jwt'> = {
        jwt: {
            tokens: {
                access: {
                    publicKey: readKeyFile(keyPath.public),
                    privateKey: readKeyFile(keyPath.private),
                    timeMs: getEnvFloat(
                        'JWT_ACCESS_TIME_MS',
                        Config.jwt.tokens.access.timeMs
                    )
                },
                confirmation: {
                    secret: getEnvString('JWT_CONFIRMATION_SECRET'),
                    timeMs: getEnvFloat(
                        'JWT_CONFIRMATION_TIME',
                        Config.jwt.tokens.confirmation.timeMs
                    )
                },
                resetPassword: {
                    secret: getEnvString('JWT_RESET_PASSWORD_SECRET'),
                    timeMs: getEnvFloat(
                        'JWT_RESET_PASSWORD_TIME',
                        Config.jwt.tokens.resetPassword.timeMs
                    )
                },
                refresh: {
                    secret: getEnvString('JWT_REFRESH_SECRET'),
                    timeMs: getEnvFloat(
                        'JWT_REFRESH_TIME',
                        Config.jwt.tokens.refresh.timeMs
                    )
                }
            }
        }
    };

    if (!config.jwt.tokens[TokenTypeEnum.CONFIRMATION].secret)
        throw new EnvException(`The JWT confirmation secret isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.RESET_PASSWORD].secret)
        throw new EnvException(`The JWT reset password secret isn't set`);
    if (!config.jwt.tokens[TokenTypeEnum.REFRESH].secret)
        throw new EnvException(`The JWT refresh secret isn't set`);

    return config;
};
