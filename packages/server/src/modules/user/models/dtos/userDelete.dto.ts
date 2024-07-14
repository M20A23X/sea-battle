import { IntersectionType } from '@nestjs/swagger';

import { IUserDelete, IUserDTO } from '#shared/types/interfaces';
import { CurrentPasswordDTO, UuidDTO } from '#/modules/base';
import { createUserDTO } from '#/utils/getModuleDTO.util';

class Data
    extends IntersectionType(UuidDTO, CurrentPasswordDTO)
    implements IUserDelete {}

class UserDeleteDTO
    extends createUserDTO<IUserDelete>(Data)
    implements IUserDTO<IUserDelete> {}

export { UserDeleteDTO };
