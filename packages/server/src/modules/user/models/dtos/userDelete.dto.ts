import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { UserDeleteData, UserReqDTO } from 'shared/types/user';
import { UserDTO } from './user.dto';

class Data
    extends PickType(UserDTO, ['userUUID', 'currentPassword'])
    implements UserDeleteData {}

class UserDeleteDTO implements UserReqDTO<UserDeleteData> {
    @ApiProperty({ type: () => Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public user: UserDeleteData;
}

export { UserDeleteDTO };
