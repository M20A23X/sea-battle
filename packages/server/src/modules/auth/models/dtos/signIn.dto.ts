import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { SignInData, UserReqDTO } from '#shared/types';

import { UserDTO } from '#/modules/user';

class Data
    extends PickType(UserDTO, ['username', 'password'])
    implements SignInData {}

class SignInDTO implements UserReqDTO<SignInData> {
    @ApiProperty({ type: () => Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public user: SignInData;
}

export { SignInDTO };
