import { ApiProperty } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IAuthCredentials, IAuthDTO } from '#shared/types/interfaces';
import { CredentialsDTO } from '#/modules/base';

//--- SignInDTO -----------
class SignInDTO implements IAuthDTO<IAuthCredentials> {
    @ApiProperty({ type: () => CredentialsDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => CredentialsDTO)
    public auth: IAuthCredentials;
}

export { SignInDTO };
