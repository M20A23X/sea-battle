import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { IPassword } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- PasswordDTO -----------
class PasswordDTO implements IPassword {
    @ApiProperty()
    @IsString()
    @MinLength(Format.password.minLength)
    @MaxLength(Format.password.maxLength)
    @Matches(Format.password.regex, {
        message: 'password' + Format.password.errorMessage
    })
    public password: string;
}

export { PasswordDTO };
