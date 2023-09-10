import { IUser, IUserPublicData } from './user';

interface IRefreshToken extends Pick<IUser, 'userId'> {
    token: string;
    accessIpv6: string;
    expirationDateTime: Date;
}

type TSignInData = Pick<IUser, 'username' | 'password'>;

type TAccessTokenRes = { accessToken: string };
type TSignInRes = TAccessTokenRes & {
    user: IUserPublicData;
    refreshToken: string;
};

type TRefreshTokenRaw = Pick<IRefreshToken, 'token' | 'expirationDateTime'>;

export {
    IRefreshToken,
    TSignInData,
    TAccessTokenRes,
    TSignInRes,
    TRefreshTokenRaw,
};
