import { HttpStatus } from '@nestjs/common';

import { IValidationConfig, NodeEnv } from '#shared/types';
import { Exception } from '#shared/exceptions';
import { Default as DefaultShared } from '#shared/static';

import envConfig from '#/configs/env.config';

export default (): IValidationConfig => ({
    validation: {
        config: {
            transform: Boolean(
                process.env.VALIDATION_TRANSFORM ||
                    DefaultShared.validation.config.transform
            ),
            whitelist: Boolean(
                process.env.VALIDATION_WHITELIST ||
                    DefaultShared.validation.config.whitelist
            ),
            forbidNonWhitelisted: Boolean(
                process.env.VALIDATION_FORBID_NON_WHITELISTED ||
                    DefaultShared.validation.config.forbidNonWhitelisted
            ),
            disableErrorMessages:
                envConfig().env.state === NodeEnv.Production ??
                DefaultShared.validation.config.disableErrorMessages
        },
        parseFilePipe: {
            fileIsRequired: Boolean(
                process.env.VALIDATION_FILE_IS_REQUIRED ||
                    DefaultShared.validation.parseFilePipe.fileIsRequired
            ),
            errorHttpStatusCode: HttpStatus.BAD_REQUEST,
            exceptionFactory: () => new Exception('NOT_PROVIDED')
        }
    }
});
