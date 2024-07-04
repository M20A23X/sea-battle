import { Request } from 'express';
import { ConsoleLogger } from '@nestjs/common';

const logRequest = (logger: ConsoleLogger, req: Request): void => {
    const { ip, method, originalUrl, httpVersion } = req;
    const reqString = JSON.stringify({
        ip,
        method,
        originalUrl,
        httpVersion
    });
    logger.log.call(logger, reqString);
};

export { logRequest };
