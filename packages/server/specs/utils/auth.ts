import { SignInRes } from 'shared/types/auth';
import { Res } from 'shared/types/requestResponse';

import { IAuthService } from 'services/auth.service';

import { SignInDTO } from 'modules/auth/models/dtos/signIn.dto';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';

type SignInUsers = (signInDTOS: SignInDTO[]) => Promise<SignInRes[]>;

const createSignInDTOs = (userCreateDTOs: UserCreateDTO[]): SignInDTO[] => {
    return userCreateDTOs.map((userCreateDTO: UserCreateDTO) => ({
        user: {
            username: userCreateDTO.user.username,
            password: userCreateDTO.user.password
        }
    }));
};

const requireSignInUsers = (authService: IAuthService): SignInUsers => {
    return async (signInDTOS: SignInDTO[]): Promise<SignInRes[]> => {
        const signInRes: SignInRes[] = [];
        for (const dto of signInDTOS) {
            const signInResp: Res<SignInRes> = await authService.signIn(
                dto.user.username,
                dto.user.password,
                '::ffff:127.0.0.1'
            );
            signInRes.push(signInResp.payload);
        }
        return signInRes;
    };
};

export type { SignInUsers };
export { requireSignInUsers, createSignInDTOs };
