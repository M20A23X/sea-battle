import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

import { IUser } from 'shared/types/user';

import { USERS_SCHEMA } from '../../../../static/format';

const { username, password, imgUrl } = USERS_SCHEMA;

export class UserDTO implements Omit<IUser, 'userId'> {
    @ApiProperty()
    @IsUUID()
    public userUUID: string;

    @ApiProperty()
    @IsString()
    @Matches(username.regex, { message: username.errorMessage })
    @Length(username.minLength, username.maxLength)
    public username: string;

    @ApiProperty()
    @IsString()
    @Matches(password.regex, { message: password.errorMessage })
    @Length(password.minLength, password.maxLength)
    public password: string;

    @ApiPropertyOptional()
    @IsString()
    @Matches(imgUrl.regex, { message: imgUrl.errorMessage })
    @MaxLength(imgUrl.maxLength)
    public imgUrl: string;
}
