import { IsOptional, IsPositive, ValidateIf } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';

import { IUsersReadData } from 'shared/types/user';

import { IsBiggerThan } from 'decorators/IsBiggerThan';

import { UserUpdateData } from 'modules/user/models/dtos/userUpdate.dto';

export class UsersReadDTO
    extends PartialType(PickType(UserUpdateData, ['userUUID', 'username']))
    implements IUsersReadData
{
    @IsPositive()
    @ValidateIf((o: UsersReadDTO) => !!o?.endId)
    @IsOptional()
    public startId: number;
    @IsPositive()
    @ValidateIf((o: UsersReadDTO) => !!o?.startId)
    @IsBiggerThan('startId' as keyof UsersReadDTO, {
        message: 'endId must be grater than startId!',
    })
    @IsOptional()
    public endId: number;
}
