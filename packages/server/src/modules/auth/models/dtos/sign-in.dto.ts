import { IAuthCredentials, IAuthDTO } from '#shared/types/interfaces';
import { CredentialsDTO } from '#/modules/base';
import { createAuthDTO } from '#/utils';

//--- SignInDTO -----------
class SignInDTO
    extends createAuthDTO(CredentialsDTO)
    implements IAuthDTO<IAuthCredentials> {}

export { SignInDTO };
