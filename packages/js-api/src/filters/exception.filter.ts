import {
    ArgumentsHost,
    Catch,
    ExceptionFilter as IExceptionFilter,
    HttpException,
    HttpStatus
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response } from 'express';

import { ResData } from '#shared/types/interfaces';
import { LoggerService } from 'services';

@Catch()
class ExceptionFilter implements IExceptionFilter {
    // --- Logger -------------------------------------------------------------
    private readonly _logger: LoggerService = new LoggerService(
        ExceptionFilter.name
    );

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------
    //--- catch -----------
    public catch(exception: Error, host: ArgumentsHost): object {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const res: Response = ctx.getResponse<Response>();

        let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        if (exception instanceof HttpException) status = exception.getStatus();

        this._logger.error(exception.stack);

        const json: ResData = { message: 'Error: ' + exception.message };
        return res.status(status).json(json);
    }
}

export { ExceptionFilter };
