import { ParseFilePipe } from '@nestjs/common';
import { IConfig } from '#/types';

const createParseFilePipe = (
    validationConfig: () => Pick<IConfig, 'validation'>
) => new ParseFilePipe(validationConfig().validation.parseFilePipe);

export { createParseFilePipe };
