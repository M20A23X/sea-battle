import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PickType } from '@nestjs/swagger';

import { UserCreateData, UserReqDTO } from 'shared/types/user';

import { UserDTO } from './user.dto';

class Data
    extends PickType(UserDTO, [
        'username',
        'password',
        'passwordConfirm',
        'imgPath'
    ] as const)
    implements UserCreateData {}

export class UserCreateDTO implements UserReqDTO<UserCreateData> {
    @ApiProperty({ type: () => Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public user: UserCreateData;
}
