import { IntersectionType, PartialType } from '@nestjs/swagger';

import { IUserDTO, IUserUpdate } from '#shared/types/interfaces';
import {
    EmailDTO,
    ImgPathDTO,
    PasswordSetDTO,
    UsernameDTO,
    UuidDTO
} from '#/modules/base';
import { createUserDTO } from '#/utils/dto.util';

class Data
    extends IntersectionType(
        UuidDTO,
        PartialType(
            IntersectionType(UsernameDTO, PasswordSetDTO, EmailDTO, ImgPathDTO)
        )
    )
    implements IUserUpdate {}

class UserUpdateDTO
    extends createUserDTO<IUserUpdate>(Data)
    implements IUserDTO<IUserUpdate> {}

export { UserUpdateDTO };
