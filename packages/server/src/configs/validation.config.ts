import { IConfigBase } from '#shared/types/config';
import { NodeEnv } from '#shared/types/interfaces';
import { getEnvBool } from '#shared/utils';

import { Config } from '#/static';
import { EnvConfig } from '#/configs';

export default (): Pick<IConfigBase, 'dtoValidation'> => ({
    dtoValidation: {
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
