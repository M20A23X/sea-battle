import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { IEmail } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- EmailDTO -----------
class EmailDTO implements IEmail {
    @ApiProperty()
    @IsString()
    @Matches(Format.email.regex, {
        message: 'email' + Format.username.errorMessage
    })
    public email: string;
}

export { EmailDTO };
