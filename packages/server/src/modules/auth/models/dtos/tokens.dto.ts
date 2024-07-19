import { IAuthDTO, IToken } from '#shared/types/interfaces';
import { createAuthDTO } from '#/utils';
import { TokenDTO } from '#/modules/base';

//--- RefreshTokenAccessDTO -----------
class AuthTokenDTO
    extends createAuthDTO(TokenDTO)
    implements IAuthDTO<IToken> {}

class RefreshTokenAccessDTO extends AuthTokenDTO {}
class ConfirmationTokenDTO extends AuthTokenDTO {}
class SignOutDTO extends AuthTokenDTO {}

export { RefreshTokenAccessDTO, ConfirmationTokenDTO, SignOutDTO };
