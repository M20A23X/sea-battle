import { Req } from './requestResponse';

interface IUser {
    userId: number;
    userUUID: string;
    username: string;
    password: string;
    imgPath: string;
}

type UserPublicData = Omit<IUser, 'userId' | 'password'>;
type UserReqDTO<V> = Req<`user`, V>;

type UserCreateData = Omit<IUser, 'userId' | 'userUUID'> & {
    passwordConfirm: string;
};
type UserUpdateData = Pick<IUser, 'userUUID'> & {
    currentPassword: string;
} & Partial<
        Pick<
            UserCreateData,
            'username' | 'password' | 'imgPath' | 'passwordConfirm'
        >
    >;
type UsersReadData = Partial<Pick<IUser, 'userUUID' | 'username'>> & {
    startId?: number;
    endId?: number;
};
type UserDeleteData = Pick<UserUpdateData, 'userUUID' | 'currentPassword'>;

export type {
    IUser,
    UserPublicData,
    UserCreateData,
    UsersReadData,
    UserUpdateData,
    UserDeleteData,
    UserReqDTO,
};
