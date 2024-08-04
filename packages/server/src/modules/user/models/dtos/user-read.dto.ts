import { getSchemaPath } from '@nestjs/swagger';
import { ApiBodyOptions } from '@nestjs/swagger/dist/decorators/api-body.decorator';

import { IUserDTO } from '#shared/types/interfaces';
import { EmailDTO, RangeDTO, UsernameDTO, UuidDTO } from '#/modules/base';
import { DTO } from '#/utils/dto.util';

//--- UserReadDTO -----------
type UserReadDTOType = IUserDTO<UsernameDTO | UuidDTO | EmailDTO | RangeDTO>;
const UserReadSchema: ApiBodyOptions = {
    schema: {
        oneOf: [
            { $ref: getSchemaPath(DTO.user(UuidDTO)) },
            { $ref: getSchemaPath(DTO.user(UsernameDTO)) },
            { $ref: getSchemaPath(DTO.user(EmailDTO)) },
            { $ref: getSchemaPath(DTO.user(RangeDTO)) }
        ]
    }
};

export { UserReadDTOType, UserReadSchema };
