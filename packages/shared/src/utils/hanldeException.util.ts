import { Response } from 'express';
import {
    ArgumentsHost,
    BadRequestException,
    ConsoleLogger,
    ForbiddenException,
    HttpStatus,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

import { ServiceException } from '../exceptions/Service.exception';

import { SERVICE_CODE_STATUS_DICT } from '../static/web';

import { getContextEntity } from './requestResponse.util';
import { decipherCode } from './decipherError.util';

import { Res, ResPayload, ServiceCode } from 'types/requestResponse';

const UNEXPECTED_ERR_CODES: ServiceCode[] = [
    'UNEXPECTED_ERROR',
    'UNEXPECTED_DB_ERROR',
];

export const handleException = (
    exception: Error,
    host: ArgumentsHost,
    loggerService: ConsoleLogger,
): object => {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const res: Response = ctx.getResponse<Response>();

    let operation = 'process';
    let serviceCode: ServiceCode = 'UNEXPECTED_ERROR';
    let context = 'RequestContext';
    let entity: string | undefined;
    let payload: ResPayload = undefined;
    let message: string | undefined = undefined;

    if (exception instanceof ServiceException) {
        operation = exception.operation;
        serviceCode = exception.code;
        context = exception.context;
        entity = exception.entity;
        payload = exception.payload;
    } else if (exception instanceof ForbiddenException) {
        serviceCode = 'FORBIDDEN';
        context = 'HTTPService';
        entity = 'Request';
    } else if (exception instanceof BadRequestException) {
        [message] = (exception.getResponse() as { message: string })['message'];
        serviceCode = 'BAD_REQUEST';
        context = 'DTOService';
    }

    const status: HttpStatus =
        SERVICE_CODE_STATUS_DICT?.[serviceCode] ??
        HttpStatus.INTERNAL_SERVER_ERROR;

    const contextEntity: string = (
        entity || getContextEntity(context)
    ).toLowerCase();
    const exceptionMessage: string = (
        message ?? decipherCode(contextEntity, serviceCode, payload)
    ).toLowerCase();

    const resMessage = `Error ${operation} ${contextEntity}s: ${exceptionMessage}!`;

    loggerService.setContext(context);
    if (UNEXPECTED_ERR_CODES.includes(serviceCode)) {
        loggerService.error(resMessage);
        if (exception?.stack) loggerService.error(exception.stack);
    } else loggerService.warn(resMessage);

    const json: Res = { message: resMessage, payload: null };
    return res.status(status).json(json);
};
