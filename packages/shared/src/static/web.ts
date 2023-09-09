import { HttpStatus } from '@nestjs/common';
import { ServiceCode } from 'types/requestResponse';

const MIME_TYPE = {
    applicationJson: 'application/json',
};

const SERVICE_CODE_STATUS_DICT: { [K in ServiceCode]: HttpStatus } = {
    SUCCESS: HttpStatus.OK,
    UNEXPECTED_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
    ER_DUP_ENTRY: HttpStatus.CONFLICT,
    NOT_FOUND: HttpStatus.NOT_FOUND,
    ER_NO_REFERENCED_ROW_2: HttpStatus.NOT_FOUND,
    PASSWORDS_DONT_MATCH: HttpStatus.UNAUTHORIZED,
    UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
};

export { MIME_TYPE, SERVICE_CODE_STATUS_DICT };
