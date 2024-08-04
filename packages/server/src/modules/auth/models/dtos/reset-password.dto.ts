import {
    IAuthDTO,
    IEmail,
    IPasswordSet,
    IToken
} from '#shared/types/interfaces';
import { IntersectionType } from '@nestjs/swagger';

import { EmailDTO, PasswordSetDTO, TokenDTO } from '#/modules/base';
import { DTO } from '#/utils';

//--- ResetPasswordDTO -----------
class RequestPasswordResetDTO
    extends DTO.auth(EmailDTO)
    implements IAuthDTO<IEmail> {}

//--- SetPasswordDTO -----------
class ResetPasswordDTO
    extends DTO.auth(IntersectionType(TokenDTO, PasswordSetDTO))
    implements IAuthDTO<IPasswordSet & IToken> {}

export { RequestPasswordResetDTO, ResetPasswordDTO };
