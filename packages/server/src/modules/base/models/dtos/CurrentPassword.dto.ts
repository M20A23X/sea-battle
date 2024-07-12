import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { ICurrentPassword } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- CurrentPasswordDTO -----------
class CurrentPasswordDTO implements ICurrentPassword {
    @ApiProperty()
    @IsString()
    @Matches(Format.password.regex, {
        message: 'password' + Format.password.errorMessage
    })
    public currentPassword: string;
}

export { CurrentPasswordDTO };
