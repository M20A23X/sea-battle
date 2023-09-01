import { IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IUser } from 'shared/types/user';

import { USERS_SCHEMA } from 'static/database';

const { username, password, imgUrl } = USERS_SCHEMA;

export class UserDTO implements Omit<IUser, 'userId'> {
    @ApiProperty()
    @IsUUID()
    public userUUID: string;
    @ApiProperty()
    @IsString()
    @Matches(username.format, { message: username.errorMessage })
    @Length(username.minLength, username.maxLength)
    public username: string;
    @ApiProperty()
    @IsString()
    @Matches(password.format, { message: password.errorMessage })
    @Length(password.minLength, password.maxLength)
    public password: string;
    @ApiPropertyOptional()
    @IsString()
    @Length(0, imgUrl.maxLength)
    public imgUrl: string;
}
