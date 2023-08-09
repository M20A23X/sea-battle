import { IsString, Length, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
    ApiProperty,
    IntersectionType,
    PartialType,
    PickType,
} from '@nestjs/swagger';

import { UserCreateData } from 'modules/user/models/dtos/userCreate.dto';
import { TUserReqDTO } from 'modules/user/models/entities/user.entity';
import { UserDTO } from 'modules/user/models/dtos/user.dto';
import { USERS_SCHEMA } from 'static/database';

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

export class UserUpdateData extends UserUpdateDataType {
    @ApiProperty()
    @IsString()
    @Length(password.minLength, password.maxLength)
    @Matches(password.format, { message: password.errorMessage })
    public currentPassword: string;
}

export class UserUpdateDTO implements TUserReqDTO<UserUpdateData> {
    @ApiProperty({ type: () => UserUpdateData })
    @ValidateNested()
    @Type(() => UserUpdateData)
    public user: UserUpdateData;
}
