import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { ICurrentPassword } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- CurrentPasswordDTO -----------
class CurrentPasswordDTO implements ICurrentPassword {
    @ApiProperty()
    @IsString()
    @MinLength(Format.password.minLength)
    @MaxLength(Format.password.maxLength)
    @Matches(Format.password.regex, {
        message: 'current password' + Format.password.errorMessage
    })
    public currentPassword: string;
}

export { CurrentPasswordDTO };
