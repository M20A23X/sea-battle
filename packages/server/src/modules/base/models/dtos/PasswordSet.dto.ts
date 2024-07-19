import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsObject,
    IsString,
    Matches,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

import { IPasswordSet } from '#shared/types/interfaces';
import { Format } from '#shared/static';

import { PasswordDTO } from '#/modules/base';

type IData = IPasswordSet['passwordSet'];
class Data extends PasswordDTO implements IData {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'password confirm must not be empty' })
    @MinLength(Format.password.minLength)
    @MaxLength(Format.password.maxLength)
    @Matches(Format.password.regex, {
        message: 'password' + Format.password.errorMessage
    })
    @ValidateIf((o: Data) => !!o.passwordConfirm)
    public password: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'password must not be empty' })
    @MinLength(Format.password.minLength)
    @MaxLength(Format.password.maxLength)
    @Matches(Format.password.regex, {
        message: 'password confirm' + Format.password.errorMessage
    })
    @ValidateIf((o: Data) => !!o.password)
    public passwordConfirm: string;
}

//--- PasswordSetDTO -----------
class PasswordSetDTO implements IPasswordSet {
    @ApiProperty({ type: Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public passwordSet: IPasswordSet['passwordSet'];
}

export { PasswordSetDTO };
