import { IPassword, IUserPublic, Req } from '#/types/interfaces/';

interface IAuthCredentials extends IPassword {
    usernameOrEmail: string;
}

interface ISession {
    accessToken: string;
    refreshToken: string;
}

interface IAuthResult {
    user: IUserPublic;
    session: ISession;
}

type IAuthDTO<T extends object> = Req<'auth', T>;

export { IAuthDTO, IAuthCredentials, ISession, IAuthResult };
