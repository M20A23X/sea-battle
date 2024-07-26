import { ValidationPipeOptions } from '@nestjs/common';
import { ParseFileOptions } from '@nestjs/common/pipes/file/parse-file-options.interface';

interface IValidationConfig {
    validation: Required<
        Pick<
            ValidationPipeOptions,
            | 'whitelist'
            | 'forbidNonWhitelisted'
            | 'transform'
            | 'disableErrorMessages'
        >
    >;
    parseFilePipe?: ParseFileOptions;
}

type IValidationDefault = IValidationConfig;

export { IValidationConfig, IValidationDefault };
