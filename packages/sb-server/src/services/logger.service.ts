import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface ILoggerService extends ConsoleLogger {
    logRequestInfo(req: Request): void;
}

@Injectable()
export class LoggerService extends ConsoleLogger implements ILoggerService {
    public logRequestInfo(req: Request): void {
        super.log(
            `Request: ${JSON.stringify({
                remoteAddress: req.ip,
                method: req.method,
                url: req.url,
                httpVersion: req.httpVersionMinor,
            })}`,
        );
    }
}
