import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { IUsername } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- UsernameDTO -----------
class UsernameDTO implements IUsername {
    @ApiProperty()
    @IsString()
    @MinLength(Format.username.minLength)
    @MaxLength(Format.username.maxLength)
    @Matches(Format.username.regex, {
        message: 'username' + Format.username.errorMessage
    })
    public username: string;
}

export { UsernameDTO };
