import { IAuthCredentials, IAuthDTO } from '#shared/types/interfaces';
import { CredentialsDTO } from '#/modules/base';
import { DTO } from '#/utils';

//--- SignInDTO -----------
class SignInDTO
    extends DTO.auth(CredentialsDTO)
    implements IAuthDTO<IAuthCredentials> {}

export { SignInDTO };
