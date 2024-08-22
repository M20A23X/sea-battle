import { IAuthDTO, IToken } from '#shared/types/interfaces';
import { DTO } from '#/utils';
import { TokenDTO } from '#/modules/base';

//--- AuthTokenDTO -----------
class AuthTokenDTO extends DTO.auth(TokenDTO) implements IAuthDTO<IToken> {}

export { AuthTokenDTO };
