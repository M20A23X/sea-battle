import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

import { IPassword } from '#shared/types/interfaces';
import { PasswordDTO } from '#/modules/base';

//--- PasswordSetDTO -----------
class PasswordSetDTO extends PasswordDTO implements IPassword {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o: PasswordSetDTO) => !!o.password)
    public passwordConfirm: string;
}

export { PasswordSetDTO };
