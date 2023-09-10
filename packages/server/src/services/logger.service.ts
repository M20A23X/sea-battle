import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { logRequestInfo } from 'shared/utils/requestResponse.util';

export interface ILoggerService extends ConsoleLogger {
    logRequestInfo(req: Request): void;
}

@Injectable()
export class LoggerService extends ConsoleLogger implements ILoggerService {
    public logRequestInfo(req: Request): void {
        logRequestInfo(this, req);
    }
}
