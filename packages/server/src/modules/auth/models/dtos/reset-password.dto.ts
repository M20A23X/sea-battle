import {
    IAuthDTO,
    IEmail,
    IPasswordSet,
    IToken
} from '#shared/types/interfaces';
import { IntersectionType } from '@nestjs/swagger';
import { EmailDTO, PasswordSetDTO, TokenDTO } from '#/modules/base';
import { createAuthDTO } from '#/utils';

//--- ResetPasswordDTO -----------
class RequestPasswordResetDTO
    extends createAuthDTO(EmailDTO)
    implements IAuthDTO<IEmail> {}

//--- SetPasswordDTO -----------
class ResetPasswordData extends IntersectionType(TokenDTO, PasswordSetDTO) {}
class ResetPasswordDTO
    extends createAuthDTO(ResetPasswordData)
    implements IAuthDTO<IPasswordSet & IToken> {}

export { RequestPasswordResetDTO, ResetPasswordDTO };
