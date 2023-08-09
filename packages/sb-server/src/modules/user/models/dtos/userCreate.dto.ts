import {
    IsNotEmpty,
    IsObject,
    IsString,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEqualTo } from 'decorators/IsEqualTo';

import { UserDTO } from 'modules/user/models/dtos/user.dto';
import { TUserReqDTO } from 'modules/user/models/entities/user.entity';

export class UserCreateData extends OmitType(UserDTO, ['userUUID'] as const) {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @ValidateIf((o: UserCreateData) => !!o.password)
    @IsEqualTo('password' as keyof UserCreateData, {
        message: 'passwords must match!',
    })
    public passwordConfirm: string;
}

export class UserCreateDTO implements TUserReqDTO<UserCreateData> {
    @ApiProperty({ type: () => UserCreateData })
    @IsObject()
    @ValidateNested()
    @Type(() => UserCreateData)
    public user: UserCreateData;
}
