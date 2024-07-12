import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { IAuthCredentials } from '#shared/types/interfaces';
import { PasswordDTO } from './Password.dto';

//--- CredentialsDTO -----------
class CredentialsDTO
    extends IntersectionType(PasswordDTO)
    implements IAuthCredentials
{
    @ApiProperty()
    @IsString()
    usernameOrEmail: string;
}

export { CredentialsDTO };
