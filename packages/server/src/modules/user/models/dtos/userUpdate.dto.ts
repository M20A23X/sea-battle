import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, IntersectionType, PartialType } from '@nestjs/swagger';

import { IUserDTO, IUserUpdate } from '#shared/types/interfaces';
import {
    CurrentPasswordDTO,
    PasswordSetDTO,
    UsernameDTO,
    UuidDTO
} from '#/modules/base';
import { ImgPathDTO } from '#/modules/base/models/dtos/ImgPath.dto';

class Data
    extends IntersectionType(
        UuidDTO,
        CurrentPasswordDTO,
        PartialType(IntersectionType(UsernameDTO, PasswordSetDTO, ImgPathDTO))
    )
    implements IUserUpdate {}

class UserUpdateDTO implements IUserDTO<IUserUpdate> {
    @ApiProperty({ type: () => Data })
    @ValidateNested()
    @Type(() => Data)
    public user: IUserUpdate;
}

export { UserUpdateDTO };
