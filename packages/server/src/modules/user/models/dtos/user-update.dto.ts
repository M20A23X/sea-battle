import { IntersectionType, PartialType } from '@nestjs/swagger';

import { IUserDTO, IUserUpdate } from '#shared/types/interfaces';
import {
    EmailDTO,
    ImgPathDTO,
    PasswordSetDTO,
    UsernameDTO,
    UuidDTO
} from '#/modules/base';
import { DTO } from '#/utils/dto.util';

//--- UserUpdateDTO -----------
class Data
    extends IntersectionType(
        UuidDTO,
        PartialType(
            IntersectionType(UsernameDTO, PasswordSetDTO, EmailDTO, ImgPathDTO)
        )
    )
    implements IUserUpdate {}

class UserUpdateDTO
    extends DTO.user<IUserUpdate>(Data)
    implements IUserDTO<IUserUpdate> {}

export { UserUpdateDTO };
