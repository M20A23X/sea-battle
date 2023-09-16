import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
    ApiProperty,
    IntersectionType,
    PartialType,
    PickType
} from '@nestjs/swagger';

import { UserUpdateData, UserReqDTO } from '#shared/types';

import { UserDTO } from './user.dto';

class Data
    extends IntersectionType(
        PickType(UserDTO, ['userUUID', 'currentPassword']),
        PartialType(
            PickType(UserDTO, [
                'username',
                'password',
                'passwordConfirm',
                'imgPath'
            ])
        )
    )
    implements UserUpdateData {}

export class UserUpdateDTO implements UserReqDTO<UserUpdateData> {
    @ApiProperty({ type: () => Data })
    @ValidateNested()
    @Type(() => Data)
    public user: UserUpdateData;
}
