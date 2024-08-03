import { ConsoleLogger, Injectable } from '@nestjs/common';
import { Request } from 'express';

interface ILoggerService extends ConsoleLogger {
    logRequestInfo(req: Request): void;
}

@Injectable()
class LoggerService extends ConsoleLogger implements ILoggerService {
    // --- logRequestInfo -------------------------------------------------------------
    public logRequestInfo(req: Request): void {
        const { ip, method, originalUrl, httpVersion } = req;
        const reqString: string = JSON.stringify({
            ip,
            method,
            originalUrl,
            httpVersion
        });
        this.log(reqString);
    }
}

export { LoggerService };
