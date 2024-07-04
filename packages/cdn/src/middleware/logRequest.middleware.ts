import { Inject, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ILoggerService, LoggerService } from 'services/logger.service';

export class LogRequestMiddleware implements NestMiddleware {
    constructor(
        @Inject(LoggerService) private _loggerService: ILoggerService
    ) {}

    use(req: Request, res: Response, next: NextFunction): void {
        this._loggerService.logRequestInfo(req);
        return next();
    }
}
