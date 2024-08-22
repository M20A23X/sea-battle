import { Inject, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from 'services/logger.service';

class LogRequestMiddleware implements NestMiddleware {
    // --- Constructor -------------------------------------------------------------
    constructor(@Inject(LoggerService) private _logger: LoggerService) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------
    //--- use -----------
    public use(req: Request, res: Response, next: NextFunction): void {
        this._logger.logRequestInfo(req);
        return next();
    }
}

export { LogRequestMiddleware };
