import {
    HttpStatus,
    ParseFilePipe,
    ValidationPipeOptions,
} from '@nestjs/common';

import { ServiceException } from 'shared/exceptions/Service.exception';

import { NODE_ENV_PROD } from 'shared/static/common';

const validationConfig: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === NODE_ENV_PROD,
};

const parseFilePipe = new ParseFilePipe({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    exceptionFactory: () =>
        new ServiceException('UPLOAD', 'file', "file isn't provided"),
});

export { validationConfig, parseFilePipe };
