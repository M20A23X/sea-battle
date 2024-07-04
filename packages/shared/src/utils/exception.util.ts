import { Response } from 'express';
import {
    ArgumentsHost,
    ConsoleLogger,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { HttpExceptionBody } from '@nestjs/common/interfaces/http/http-exception-body.interface';

import { ServiceRes } from '#/types';
import { Exception } from '#/exceptions';

import { Web } from '#/static';

const handleException = (
    exception: Error,
    host: ArgumentsHost,
    logger: ConsoleLogger
): object => {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const res: Response = ctx.getResponse<Response>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageRaw: string;
    if (exception instanceof Exception) {
        messageRaw = exception.message;
        status = Web.codeStatusDict[exception.code];
    } else {
        const exceptionCasted: HttpException = exception as HttpException;
        const res: string | object | undefined =
            exceptionCasted?.getResponse?.() ?? exceptionCasted.message;
        if (typeof res === 'object') {
            const resCasted: HttpExceptionBody = res as HttpExceptionBody;
            messageRaw =
                resCasted.message instanceof Array
                    ? resCasted.message[0]
                    : resCasted.message;
            status = resCasted.statusCode;
        } else messageRaw = res;
    }

    logger.error(exception.stack);

    const json: ServiceRes = { message: `Error: ` + messageRaw };
    return res.status(status).json(json);
};

export { handleException };
