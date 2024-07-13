import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

import { handleException } from '#shared/utils';

import { LoggerService } from 'services/logger.service';

@Catch()
class ExceptionLoggerFilter implements ExceptionFilter {
    // --- Logger -------------------------------------------------------------
    private readonly _loggerService: LoggerService = new LoggerService();

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------
    //--- catch -----------
    public catch(exception: Error, host: ArgumentsHost): object {
        return handleException(exception, host, this._loggerService);
    }
}

export { ExceptionLoggerFilter };
