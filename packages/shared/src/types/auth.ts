import { IUser, UserPublicData } from './user';

interface IRefreshToken extends Pick<IUser, 'userId'> {
    token: string;
    accessIpv6: string;
    expirationDateTime: Date;
}

type SignInData = Pick<IUser, 'username' | 'password'>;

type AccessTokenRes = { accessToken: string };
type SignInRes = AccessTokenRes & {
    user: UserPublicData;
    refreshToken: string;
};

type RefreshTokenRaw = Pick<IRefreshToken, 'token' | 'expirationDateTime'>;

export {
    IRefreshToken,
    SignInData,
    AccessTokenRes,
    SignInRes,
    RefreshTokenRaw
};
