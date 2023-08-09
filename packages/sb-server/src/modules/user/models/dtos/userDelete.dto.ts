import { PickType } from '@nestjs/swagger';
import { UserUpdateData } from 'modules/user/models/dtos/userUpdate.dto';

export class UserDeleteDTO extends PickType(UserUpdateData, [
    'userUUID',
    'currentPassword',
]) {}
