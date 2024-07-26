import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

import { NodeEnv } from '#shared/types/interfaces';
import { getEnvFloat, getEnvString } from '#shared/utils';
import { EnvException } from '#shared/exceptions';
import { IConfig } from '#/types';

import { Config } from '#/static';
import { EnvConfig } from '#/configs';

export default (): Pick<IConfig, 'database'> => {
    const config: Pick<IConfig, 'database'> = {
        database: {
            passwordSecret: getEnvString('DATABASE_PASSWORD_SECRET'),
            datasource: {
                username: getEnvString('DATABASE_USERNAME'),
                password: getEnvString('DATABASE_PASSWORD'),
                host: getEnvString(
                    'DATABASE_IP',
                    Config.database.datasource.host
                ),
                port: getEnvFloat(
                    'DATABASE_PORT',
                    Config.database.datasource.port
                ),
                database: getEnvString(
                    'DATABASE_NAME',
                    Config.database.datasource.database
                ),
                synchronize:
                    EnvConfig().env.state !== NodeEnv.Production ??
                    Config.database.datasource.synchronize,
                type: getEnvString(
                    'DATABASE_TYPE',
                    Config.database.datasource.type
                ) as MysqlConnectionOptions['type']
            },
            limitFallback: getEnvFloat(
                'DATABASE_MAX_READ_FALLBACK',
                Config.database.limitFallback
            )
        }
    };

    if (!config.database.datasource.username)
        throw new EnvException(`The database username isn't set`);
    if (!config.database.datasource.password)
        throw new EnvException(`The database password isn't set`);
    if (!config.database.passwordSecret)
        throw new EnvException(`The database password secret isn't set`);

    return config;
};
