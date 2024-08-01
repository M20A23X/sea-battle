import { NodeEnv } from '#shared/types/interfaces';
import { EnvException } from '#shared/exceptions';
import { getEnvFloat, getEnvString } from '#shared/utils';

import { IConfig } from '#/types';
import { Config } from '#/static';

export default (): Pick<IConfig, 'env'> => {
    const config: Pick<IConfig, 'env'> = {
        env: {
            appId: getEnvString('APP_ID'),
            appName: getEnvString('APP_NAME'),
            port: getEnvFloat('SERVER_PORT_HTTP', Config.env.port),
            portWs: getEnvFloat('SERVER_PORT_WS', Config.env.portWs),
            frontEndOrigin: getEnvString(
                'CLIENT_ORIGIN',
                Config.env.frontEndOrigin
            ),
            state: getEnvString('NODE_ENV', Config.env.state) as NodeEnv
        }
    };

    if (!config.env.appId)
        throw new EnvException(`The application id isn't set`);

    return config;
};
