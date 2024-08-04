import { IUserDelete, IUserDTO } from '#shared/types/interfaces';
import { UuidDTO } from '#/modules/base';
import { DTO } from '#/utils/dto.util';

//--- UserDeleteDTO -----------
class UserDeleteDTO
    extends DTO.user<IUserDelete>(UuidDTO)
    implements IUserDTO<IUserDelete> {}

export { UserDeleteDTO };
