import { getEnvFloat, getEnvString } from '#shared/utils';
import { EnvException } from '#shared/exceptions';
import { Config } from '#/static';
import { IConfig } from '#/types';

export default (): Pick<IConfig, 'email'> => {
    const config: Pick<IConfig, 'email'> = {
        email: {
            credentials: {
                username: getEnvString('EMAIL_USERNAME'),
                password: getEnvString('EMAIL_PASSWORD')
            },
            host: getEnvString('EMAIL_HOST', Config.email.host),
            port: getEnvFloat('EMAIL_PORT', Config.email.port),
            secure: Boolean(getEnvString('EMAIL_SECURE')) ?? Config.email.secure
        }
    };

    if (!config.email.credentials.username)
        throw new EnvException(`The email user isn't set`);
    if (!config.email.credentials.password)
        throw new EnvException(`The email password isn't set`);

    return config;
};
