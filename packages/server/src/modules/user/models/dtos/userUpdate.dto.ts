import { IsString, Length, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
    ApiProperty,
    IntersectionType,
    PartialType,
    PickType,
} from '@nestjs/swagger';

import { IUserUpdateData, TUserReqDTO } from 'shared/types/user';

import { USERS_SCHEMA } from '../../../../static/format';
import { UserDTO } from './user.dto';

import { UserCreateData } from 'modules/user/models/dtos/userCreate.dto';

const { password } = USERS_SCHEMA;

const UserUpdateDataType = IntersectionType(
    PickType(UserDTO, ['userUUID']),
    PartialType(
        IntersectionType(
            PickType(UserDTO, ['username', 'password', 'imgUrl']),
            PickType(UserCreateData, ['passwordConfirm']),
        ),
    ),
);

export class UserUpdateData
    extends UserUpdateDataType
    implements IUserUpdateData
{
    @ApiProperty()
    @IsString()
    @Length(password.minLength, password.maxLength)
    @Matches(password.regex, { message: password.errorMessage })
    public currentPassword: string;
}

export class UserUpdateDTO implements TUserReqDTO<UserUpdateData> {
    @ApiProperty({ type: () => UserUpdateData })
    @ValidateNested()
    @Type(() => UserUpdateData)
    public user: UserUpdateData;
}
