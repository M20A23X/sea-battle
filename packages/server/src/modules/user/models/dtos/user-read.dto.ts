import { getSchemaPath } from '@nestjs/swagger';
import { ApiBodyOptions } from '@nestjs/swagger/dist/decorators/api-body.decorator';

import { IUserDTO } from '#shared/types/interfaces';
import { EmailDTO, RangeDTO, UsernameDTO, UuidDTO } from '#/modules/base';
import { createUserDTO } from '#/utils/dto.util';

type UserReadDTOType = IUserDTO<UsernameDTO | UuidDTO | EmailDTO | RangeDTO>;
const UserReadSchema: ApiBodyOptions = {
    schema: {
        oneOf: [
            { $ref: getSchemaPath(createUserDTO(UuidDTO)) },
            { $ref: getSchemaPath(createUserDTO(UsernameDTO)) },
            { $ref: getSchemaPath(createUserDTO(EmailDTO)) },
            { $ref: getSchemaPath(createUserDTO(RangeDTO)) }
        ]
    }
};

export { UserReadDTOType, UserReadSchema };
