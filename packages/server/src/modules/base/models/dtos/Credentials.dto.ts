import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IAuthCredentials } from '#shared/types/interfaces';
import { PasswordDTO } from './password.dto';

//--- CredentialsDTO -----------
class CredentialsDTO
    extends IntersectionType(PasswordDTO)
    implements IAuthCredentials
{
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    usernameOrEmail: string;
}

export { CredentialsDTO };
