import { PickType } from '@nestjs/swagger';

import { TSignInData } from 'shared/types/auth';
import { UserDTO } from 'modules/user/models/dtos/user.dto';

export class SignInDTO
    extends PickType(UserDTO, ['username', 'password'])
    implements TSignInData {}
