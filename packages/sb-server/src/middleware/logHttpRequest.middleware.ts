import { Inject, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request } from 'express';
import { Response } from 'supertest';
import { ILoggerService, LoggerService } from 'services/logger.service';

export class LogHttpRequestMiddleware implements NestMiddleware {
    constructor(
        @Inject(LoggerService) private _loggerService: ILoggerService,
    ) {}

    use(req: Request, res: Response, next: NextFunction): void {
        this._loggerService.logRequestInfo(req);
        return next();
    }
}
