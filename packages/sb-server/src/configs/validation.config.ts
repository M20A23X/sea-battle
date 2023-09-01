import { ValidationPipeOptions } from '@nestjs/common';

export const validationConfig: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'PRODUCTION',
};
