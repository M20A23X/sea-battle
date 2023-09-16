import { Response } from 'express';
import {
    ArgumentsHost,
    ConsoleLogger,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

import { MessagePayload, Res, ServiceCode } from '#/types';

import { ServiceException } from '#/exceptions';

import { SERVICE_CODE_STATUS_DICT } from '#/static';

import { decipherCode, getContextEntity } from '#/utils';

const UNEXPECTED_ERR_CODES: ServiceCode[] = [
    'UNEXPECTED_ERROR',
    'UNEXPECTED_DB_ERROR'
];

const logException = (
    loggerService: ConsoleLogger,
    operation: string,
    serviceCode: ServiceCode,
    context: string,
    entity: string,
    message: string | undefined,
    stack: string | undefined,
    payload: MessagePayload
): string => {
    loggerService.setContext(context);
    const contextEntity: string = (
        entity || getContextEntity(context)
    ).toLowerCase();
    const exceptionMessage: string =
        message ?? decipherCode(contextEntity, serviceCode, payload);
    const resMessage = `Error ${operation.toLowerCase()} ${contextEntity}s: ${exceptionMessage}!`;

    loggerService.setContext(context);
    if (UNEXPECTED_ERR_CODES.includes(serviceCode)) {
        loggerService.error(resMessage);
        if (stack) loggerService.error(stack);
    } else loggerService.warn(resMessage);

    return resMessage;
};

export const handleException = (
    exception: Error,
    host: ArgumentsHost,
    loggerService: ConsoleLogger
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

    const resMessage: string = logException(
        loggerService,
        operation,
        serviceCode,
        context,
        entity,
        message,
        exception.stack,
        payload
    );

    const json: Res = { message: resMessage };
    return res.status(status).json(json);
};
