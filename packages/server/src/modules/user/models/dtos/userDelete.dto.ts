import { PickType } from '@nestjs/swagger';
import { IUserDeleteData } from 'shared/types/user';
import { UserUpdateData } from 'modules/user/models/dtos/userUpdate.dto';

export class UserDeleteDTO
    extends PickType(UserUpdateData, ['userUUID', 'currentPassword'])
    implements IUserDeleteData {}
