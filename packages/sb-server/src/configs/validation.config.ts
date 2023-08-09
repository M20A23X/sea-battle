import { ValidationPipeOptions } from '@nestjs/common';

export const VALIDATION_CONFIG: ValidationPipeOptions = {
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'PRODUCTION',
};
