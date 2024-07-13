import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { logRequest } from '#shared/utils';

interface ILoggerService extends ConsoleLogger {
    logRequestInfo(req: Request): void;
}

@Injectable()
class LoggerService extends ConsoleLogger implements ILoggerService {
    public logRequestInfo(req: Request): void {
        logRequest(this, req);
    }
}

export { LoggerService };
