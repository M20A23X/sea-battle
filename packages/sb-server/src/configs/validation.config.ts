import { ValidationPipeOptions } from '@nestjs/common';
import * as classValidator from '@nestjs/class-validator';
import * as classTransformer from '@nestjs/class-transformer';

export const VALIDATION_CONFIG: ValidationPipeOptions = {
    validatorPackage: classValidator,
    transformerPackage: classTransformer,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: process.env.NODE_ENV === 'PRODUCTION',
};
