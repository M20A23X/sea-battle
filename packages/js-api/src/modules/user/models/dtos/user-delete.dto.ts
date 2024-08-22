import { IUserDelete, IUserDTO } from '#shared/types/interfaces';
import { UuidDTO } from '#/modules/base';
import { createUserDTO } from '#/utils/dto.util';

class UserDeleteDTO
    extends createUserDTO<IUserDelete>(UuidDTO)
    implements IUserDTO<IUserDelete> {}

export { UserDeleteDTO };
