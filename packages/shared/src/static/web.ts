import { HttpStatus } from '@nestjs/common';
import { ServiceCode } from 'types/requestResponse';

const MIME_TYPE = {
    applicationJson: 'application/json',
    multipartFormData: 'multipart/form-data',
};

const SERVICE_CODE_STATUS_DICT: { [K in ServiceCode]: HttpStatus } = {
    BAD_REQUEST: HttpStatus.BAD_REQUEST,
    ER_DUP_ENTRY: HttpStatus.CONFLICT,
    HTTP_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    ER_NO_REFERENCED_ROW_2: HttpStatus.NOT_FOUND,
    NOT_FOUND: HttpStatus.NOT_FOUND,
    NOT_PROVIDED: HttpStatus.BAD_REQUEST,
    PASSWORDS_DONT_MATCH: HttpStatus.UNAUTHORIZED,
    UNACCEPTABLE_EXT: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    NO_TOKEN: HttpStatus.UNAUTHORIZED,
    IP_CHANGED: HttpStatus.UNAUTHORIZED,
    NO_SESSION: HttpStatus.UNAUTHORIZED,
    SESSION_EXPIRED: HttpStatus.UNAUTHORIZED,
    UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    UNEXPECTED_DB_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

const SERVICE_CODE_MESSAGE_DICT: {
    [K in ServiceCode]: (entity?: string) => string;
} = {
    BAD_REQUEST: (entity) => `incorrect ${entity}s request`,
    IP_CHANGED: () => 'ip change detected - please, sing in again',
    SESSION_EXPIRED: () => 'session expired - please, sign in again',
    NO_SESSION: () => 'no session found for this token - please, sign in first',
    NO_TOKEN: () => `no refresh token provided`,
    NOT_FOUND: (entity) => `no ${entity}s found`,
    PASSWORDS_DONT_MATCH: () => "passwords don't match",
    UNACCEPTABLE_EXT: (entity) => `unacceptable ${entity} extension`,
    NOT_PROVIDED: (entity) => `${entity} isn't provided`,
    ER_DUP_ENTRY: (entity) => `${entity} already exists`,
    ER_NO_REFERENCED_ROW_2: () => `referenced record doesn't exist`,
    HTTP_ERROR: () => `HTTP error`,
    UNEXPECTED_DB_ERROR: () => 'unexpected database error',
    UNEXPECTED_ERROR: () => 'unexpected error',
};

export { MIME_TYPE, SERVICE_CODE_STATUS_DICT, SERVICE_CODE_MESSAGE_DICT };
