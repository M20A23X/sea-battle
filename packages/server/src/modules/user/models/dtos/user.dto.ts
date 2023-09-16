import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsPositive,
    IsString,
    IsUUID,
    Matches,
    ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';

import { UserCreateData, UsersReadData, UserUpdateData } from '#shared/types';

import { USERS_SCHEMA } from '#/static/format';

import { IsBiggerThanOrEqual, IsEqualTo } from '#/decorators';

const { username, password, imgPath } = USERS_SCHEMA;

type IUserDTO = Required<UserCreateData & UserUpdateData & UsersReadData>;
class UserDTO implements IUserDTO {
    @ApiProperty()
    @IsUUID()
    public userUUID: string;

    @ApiProperty()
    @IsString()
    @Matches(username.regex, { message: username.errorMessage })
    public username: string;

    @ApiProperty()
    @IsString()
    @Matches(password.regex, { message: password.errorMessage })
    public password: string;

    @ApiPropertyOptional()
    @IsString()
    @Matches(imgPath.regex, { message: imgPath.errorMessage })
    public imgPath: string;

    @ApiProperty()
    @IsString()
    @Matches(password.regex, { message: password.errorMessage })
    public currentPassword: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o: UserCreateData) => !!o.password)
    @IsEqualTo('password' as keyof UserCreateData, {
        message: 'passwords must match!'
    })
    public passwordConfirm: string;

    @ApiProperty()
    @Type(() => Number)
    @IsPositive()
    @ValidateIf((o: UserDTO) => !!o?.endId)
    public startId: number;

    @ApiProperty()
    @Type(() => Number)
    @IsPositive()
    @ValidateIf((o: UserDTO) => !!o?.startId)
    @IsBiggerThanOrEqual('startId' as keyof UserDTO, {
        message: 'endId must be grater than startId!'
    })
    public endId: number;
}

export type { IUserDTO };
export { UserDTO };
