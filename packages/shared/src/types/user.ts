import { TRequest } from './requestResponse';

interface IUser {
    userId: number;
    userUUID: string;
    username: string;
    password: string;
    imgUrl: string;
}

type IUserPublicData = Omit<IUser, 'userId' | 'password'>;
type TUserReqDTO<V> = TRequest<`user`, V>;

type IUserCreateData = Omit<IUser, 'userId' | 'userUUID'> & {
    passwordConfirm: string;
};
type IUsersReadData = Partial<
    Pick<IUserUpdateData, 'userUUID' | 'username'>
> & { startId?: number; endId?: number };
type IUserUpdateData = Pick<IUser, 'userUUID'> &
    Partial<Pick<IUser, 'username' | 'password' | 'imgUrl'>> &
    Partial<Pick<IUserCreateData, 'passwordConfirm'>> & {
        currentPassword: string;
    };
type IUserDeleteData = Pick<IUserUpdateData, 'userUUID' | 'currentPassword'>;

export {
    IUser,
    IUserPublicData,
    IUserCreateData,
    IUsersReadData,
    IUserUpdateData,
    IUserDeleteData,
    TUserReqDTO,
};
