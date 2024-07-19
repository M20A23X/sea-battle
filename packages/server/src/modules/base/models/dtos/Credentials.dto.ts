import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IAuthCredentials } from '#shared/types/interfaces';
import { PasswordDTO } from './password.dto';

//--- CredentialsDTO -----------
class CredentialsDTO extends PasswordDTO implements IAuthCredentials {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    usernameOrEmail: string;
}

export { CredentialsDTO };
