import { Inject, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from 'services/logger.service';

class LogRequestMiddleware implements NestMiddleware {
    // --- Constructor -------------------------------------------------------------
    constructor(@Inject(LoggerService) private _loggerService: LoggerService) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------
    //--- use -----------
    public use(req: Request, res: Response, next: NextFunction): void {
        this._loggerService.logRequestInfo(req);
        return next();
    }
}

export { LogRequestMiddleware };
