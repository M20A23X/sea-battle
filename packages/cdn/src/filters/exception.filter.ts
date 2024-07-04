import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { handleException } from '#shared/utils';

import { ILoggerService, LoggerService } from 'services/logger.service';

@Catch()
export class ExceptionLoggerFilter implements ExceptionFilter {
    ///--- Private ---///
    private readonly _loggerService: ILoggerService = new LoggerService();

    ///--- Public ---///
    public catch(exception: Error, host: ArgumentsHost): object {
        return handleException(exception, host, this._loggerService);
    }
}
