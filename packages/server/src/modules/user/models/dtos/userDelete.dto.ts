import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IUserDelete, IUserDTO } from '#shared/types/interfaces';
import { CurrentPasswordDTO, UuidDTO } from '#/modules/base';

class Data
    extends IntersectionType(UuidDTO, CurrentPasswordDTO)
    implements IUserDelete {}

class UserDeleteDTO implements IUserDTO<IUserDelete> {
    @ApiProperty({ type: () => Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public user: IUserDelete;
}

export { UserDeleteDTO };
