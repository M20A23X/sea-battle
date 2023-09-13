import { Response } from 'express';
import {
    ArgumentsHost,
    ConsoleLogger,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

import { ServiceException } from 'exceptions/Service.exception';

import { SERVICE_CODE_STATUS_DICT } from 'static/web';

import { getContextEntity } from './requestResponse.util';
import { decipherCode } from './decipherError.util';

import { Res, MessagePayload, ServiceCode } from 'types/requestResponse';

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
    let serviceCode: ServiceCode | 'HTTP_ERROR' = 'UNEXPECTED_ERROR';
    let context = 'ExceptionFilter';
    let entity = 'Request';
    let payload: MessagePayload = undefined;
    let message: string | undefined = undefined;
    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof ServiceException) {
        operation = exception.operation;
        serviceCode = exception.code;
        context = exception.context;
        entity = exception.entity;
        payload = exception.payload;
        status = SERVICE_CODE_STATUS_DICT[serviceCode];
    } else if (exception instanceof HttpException) {
        serviceCode = 'HTTP_ERROR';
        const res: string | object = exception.getResponse();
        if (typeof res === 'object') {
            const resCasted = res as {
                message: string | string[];
                statusCode: HttpStatus;
            };
            const resMessage: string | string[] = resCasted.message;
            message = resMessage instanceof Array ? resMessage[0] : resMessage;
            status = resCasted.statusCode;
        } else message = res;
    } else {
        const exceptionCasted = exception as Error & {
            statusCode?: HttpStatus;
        };
        if (exceptionCasted?.statusCode) status = exceptionCasted.statusCode;
        if (status === HttpStatus.NOT_FOUND) return res.sendStatus(status);
    }

    const contextEntity: string = (
        entity || getContextEntity(context)
    ).toLowerCase();
    const exceptionMessage: string =
        message ?? decipherCode(contextEntity, serviceCode, payload);

    const resMessage = `Error ${operation.toLowerCase()} ${contextEntity}s: ${exceptionMessage}!`;

    loggerService.setContext(context);
    if (UNEXPECTED_ERR_CODES.includes(serviceCode)) {
        loggerService.error(resMessage);
        if (exception?.stack) loggerService.error(exception.stack);
    } else loggerService.warn(resMessage);

    const json: Res = { message: resMessage };
    return res.status(status).json(json);
};
