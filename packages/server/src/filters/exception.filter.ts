import {
    ArgumentsHost,
    Catch,
    ExceptionFilter as IExceptionFilter
} from '@nestjs/common';

import { handleException } from '#shared/utils';

import { LoggerService } from 'services/logger.service';

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
        return handleException(exception, host, this._logger);
    }
}

export { ExceptionFilter };
