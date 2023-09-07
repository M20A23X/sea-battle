import { QueryError } from 'mysql2';
import { ServiceCode } from 'shared/types/requestResponse';
import { ILoggerService } from 'services/logger.service';

const decipherError = (
    entityName: string,
    loggerService: ILoggerService | undefined,
    code: { serviceCode?: ServiceCode; error?: unknown },
): string => {
    const { serviceCode: providedServiceCode, error } = code;
    let serviceCode: ServiceCode = providedServiceCode ?? 'SUCCESS';
    let errorStack: string | undefined;
    let errorMessage = '';

    if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error?.stack;
        serviceCode = (error as QueryError)?.code as ServiceCode;
    }

    let message = '';
    switch (serviceCode) {
        case 'SUCCESS':
        case 'UNAUTHORIZED':
            break;
        case 'NOT_FOUND':
            message = `no ${entityName}s found`;
            break;
        case 'PASSWORDS_DONT_MATCH':
            message = "passwords don't match";
            break;
        case 'ER_DUP_ENTRY':
            message = `record already exists`;
            break;
        case 'ER_NO_REFERENCED_ROW_2':
            message = `referenced record doesn't exist`;
            break;
        default:
            const errMsg = 'Unexpected error'.concat(
                errorStack ?? errorMessage,
            );
            loggerService?.error(`Unexpected error: ${errMsg}`);
            break;
    }

    return message;
};

export { decipherError };
