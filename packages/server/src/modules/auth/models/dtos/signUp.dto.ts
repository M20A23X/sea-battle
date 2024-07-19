import { IntersectionType } from '@nestjs/swagger';

import { IAuthDTO, IUserCreate } from '#shared/types/interfaces';
import {
    EmailDTO,
    ImgPathDTO,
    PasswordSetDTO,
    UsernameDTO
} from '#/modules/base';
import { createAuthDTO } from '#/utils';

class Data
    extends IntersectionType(UsernameDTO, EmailDTO, PasswordSetDTO, ImgPathDTO)
    implements IUserCreate {}

class SignUpDTO
    extends createAuthDTO<IUserCreate>(Data)
    implements IAuthDTO<IUserCreate> {}

export { SignUpDTO };
