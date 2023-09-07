import { IUser, IUserPublicData } from './user';

interface IRefreshToken extends Pick<IUser, 'userId'> {
    token: string;
    accessIpv6: string;
    expirationDateTime: Date;
}

type TSignInData = Pick<IUser, 'username' | 'password'>;

type TRefreshJwtRes = { accessToken: string };
type TSignInRes = TRefreshJwtRes & {
    user: IUserPublicData;
    refreshToken: string;
};

type TRefreshTokenRaw = Pick<IRefreshToken, 'token' | 'expirationDateTime'>;

export {
    IRefreshToken,
    TSignInData,
    TRefreshJwtRes,
    TSignInRes,
    TRefreshTokenRaw,
};
