import { Req } from './requestResponse';

interface IUser {
    userId: number;
    userUUID: string;
    username: string;
    password: string;
    imgUrl: string;
}

type IUserPublicData = Omit<IUser, 'userId' | 'password'>;
type TUserReqDTO<V> = Req<`user`, V>;

type IUserCreateData = Omit<IUser, 'userId' | 'userUUID'> & {
    passwordConfirm: string;
};
type IUserUpdateData = Pick<IUser, 'userUUID'> & {
    currentPassword: string;
} & Partial<
        Pick<
            IUserCreateData,
            'username' | 'password' | 'imgUrl' | 'passwordConfirm'
        >
    >;
type IUsersReadData = Partial<Pick<IUser, 'userUUID' | 'username'>> & {
    startId: number;
    endId?: number;
};
type IUserDeleteData = Pick<IUserUpdateData, 'userUUID' | 'currentPassword'>;

export type {
    IUser,
    IUserPublicData,
    IUserCreateData,
    IUsersReadData,
    IUserUpdateData,
    IUserDeleteData,
    TUserReqDTO,
};
