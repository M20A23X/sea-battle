import { NodeEnv } from '#shared/types/interfaces';
import { getEnvBool } from '#shared/utils';

import { IConfig } from '#/types';
import { Config } from '#/static';
import { EnvConfig } from '#/configs';

export default (): Pick<IConfig, 'validation'> => ({
    validation: {
        validation: {
            transform: getEnvBool(
                'VALIDATION_TRANSFORM',
                Config.validation.validation.transform
            ),
            whitelist: getEnvBool(
                'VALIDATION_WHITELIST',
                Config.validation.validation.whitelist
            ),
            forbidNonWhitelisted: getEnvBool(
                'VALIDATION_FORBID_NON_WHITELISTED',
                Config.validation.validation.forbidNonWhitelisted
            ),
            disableErrorMessages:
                EnvConfig().env.state === NodeEnv.Production ??
                Config.validation.validation.disableErrorMessages
        }
    }
});
