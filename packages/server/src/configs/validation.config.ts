import { ValidationPipeOptions } from '@nestjs/common';
import { NODE_ENV_PROD } from '#shared/static';

export const validationConfig: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === NODE_ENV_PROD
};
