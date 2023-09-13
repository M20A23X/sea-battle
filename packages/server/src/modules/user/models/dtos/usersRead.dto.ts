import { PartialType, PickType } from '@nestjs/swagger';
import { UsersReadData } from 'shared/types/user';
import { UserDTO } from './user.dto';

class UsersReadDTO
    extends PartialType(
        PickType(UserDTO, ['userUUID', 'username', 'startId', 'endId'])
    )
    implements UsersReadData {}

export { UsersReadDTO };
