import { ConsoleLogger } from '@nestjs/common';
import { ServiceCode } from './requestResponse';

export type TDecipherError = (
    entityName: string,
    loggerService: ConsoleLogger | undefined,
    code: { serviceCode?: ServiceCode; error?: unknown },
) => string;
