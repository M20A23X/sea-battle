import { Request } from 'express';
import { ConsoleLogger } from '@nestjs/common';

const logRequestInfo = (log: ConsoleLogger['log'], req: Request): void => {
    Function.prototype.call(
        log,
        `Request: ${JSON.stringify({
            remoteAddress: req.ip,
            method: req.method,
            url: req.url,
            httpVersion: req.httpVersionMinor,
        })}`,
    );
};

export { logRequestInfo };
