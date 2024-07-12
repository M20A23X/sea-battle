import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { IUsername } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- UsernameDTO -----------
class UsernameDTO implements IUsername {
    @ApiProperty()
    @IsString()
    @Matches(Format.username.regex, {
        message: 'username' + Format.username.errorMessage
    })
    public username: string;
}

export { UsernameDTO };
