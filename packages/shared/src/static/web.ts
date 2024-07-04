import { HttpStatus } from '@nestjs/common';
import { ServiceCode } from '#/types';
import { Default } from '#/static';

type Web<T extends string> = {
    codeStatusDict: { [K in T]: HttpStatus };
    codeMessageDict: { [K in T]: (entity?: string) => string };
};

enum MimeType {
    ApplicationJson = 'applicationJson',
    MultipartFormData = 'multipart/form-data'
}

const Web: Web<ServiceCode> = {
    codeStatusDict: {
        BAD_REQUEST: HttpStatus.BAD_REQUEST,
        ER_DUP_ENTRY: HttpStatus.CONFLICT,
        ER_NO_REFERENCED_ROW_2: HttpStatus.NOT_FOUND,
        HTTP_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
        IP_CHANGED: HttpStatus.UNAUTHORIZED,
        NOT_FOUND: HttpStatus.NOT_FOUND,
        NOT_PROVIDED: HttpStatus.BAD_REQUEST,
        NO_SESSION: HttpStatus.UNAUTHORIZED,
        NO_TOKEN: HttpStatus.UNAUTHORIZED,
        PASSWORDS_DONT_MATCH: HttpStatus.UNAUTHORIZED,
        RESOURCE_NOT_SAVED: HttpStatus.INTERNAL_SERVER_ERROR,
        SESSION_EXPIRED: HttpStatus.UNAUTHORIZED,
        UNACCEPTABLE_EXT: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        UNACCEPTABLE_NAME: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        UNEXPECTED_DB_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
        UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
        UNHEALTHY: HttpStatus.INTERNAL_SERVER_ERROR
    },
    codeMessageDict: {
        BAD_REQUEST: (entity) =>
            `incorrect ${entity ? entity + ' ' : ''} request`,
        ER_DUP_ENTRY: () => 'ip change detected - please, sing in again',
        HTTP_ERROR: () => 'session expired - please, sign in again',
        ER_NO_REFERENCED_ROW_2: () =>
            'no session found for this token - please, sign in first',
        NOT_FOUND: (entity) => `the ${entity ?? 'entity'} can't be found`,
        NOT_PROVIDED: (entity) => `no ${entity}s found`,
        PASSWORDS_DONT_MATCH: () => "passwords don't match",
        UNACCEPTABLE_EXT: (extension) =>
            `unacceptable file extension '${extension}'`,
        UNACCEPTABLE_NAME: () =>
            `the filename should contain only '${Default.file.name.allowedChars}' and have no more than ${Default.file.name.maxlength} symbols in length`,
        NO_TOKEN: (tokenType) => `${tokenType} isn't provided`,
        IP_CHANGED: () => `ip changed`,
        NO_SESSION: () => `referenced record doesn't exist`,
        RESOURCE_NOT_SAVED: () => `a new resource hasn't been saved`,
        SESSION_EXPIRED: () => `HTTP error`,
        UNEXPECTED_ERROR: () => 'unexpected error',
        UNEXPECTED_DB_ERROR: () => 'unexpected database error',
        UNHEALTHY: () => 'unhealthy'
    }
};

export { MimeType, Web };
