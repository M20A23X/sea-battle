import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { IEmail } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- EmailDTO -----------
class EmailDTO implements IEmail {
    @ApiProperty()
    @IsString()
    @MinLength(Format.email.minLength)
    @MaxLength(Format.email.maxLength)
    @Matches(Format.email.regex, {
        message: 'email' + Format.email.errorMessage
    })
    public email: string;
}

export { EmailDTO };
