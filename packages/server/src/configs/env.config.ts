import { IConfigBase } from '#shared/types/config';
import { NodeEnv } from '#shared/types/interfaces';
import { EnvException } from '#shared/exceptions';
import { getEnvFloat, getEnvString } from '#shared/utils';

import { Config } from '#/static';

export default (): Pick<IConfigBase, 'env'> => {
    const config: Pick<IConfigBase, 'env'> = {
        env: {
            appId: getEnvString('APP_ID'),
            port: getEnvFloat('APP_PORT', Config.env.port),
            portWs: getEnvFloat('APP_PORT_WS', Config.env.portWs),
            frontEndDomain: getEnvString(
                'FE_DOMAIN',
                Config.env.frontEndDomain
            ),
            state: getEnvString('NODE_ENV', Config.env.state) as NodeEnv
        }
    };

    if (!config.env.appId)
        throw new EnvException(`The application id isn't set`);

    return config;
};
