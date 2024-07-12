import {
    IEmail,
    IImgPath,
    IPassword,
    IPasswordSet,
    IUserId,
    IUsername,
    IUuid,
    Req
} from '#/types/interfaces';

interface IUserCredentials {
    version: number;
    passwordUpdatedAt: Date;
    updatedAt: Date;
    createdAt: Date;
    confirmed: boolean;
}
interface IUserBase extends IUsername, IEmail, IImgPath {}

interface IUserPublic extends IUserBase, IUuid {}
interface IUser extends IUserPublic, IUserId, IPassword {
    credentials: IUserCredentials;
}

type UserType<T> = T extends true ? IUser : IUserPublic;

interface IUserCreate extends IUserBase, IPasswordSet {}
interface IUserUpdate extends IUuid, Partial<IUserBase & IPasswordSet> {}
type IUserDelete = IUuid;

type IUserDTO<T extends object> = Req<'user', T>;

export type {
    IUser,
    IUserBase,
    IUserCredentials,
    IUserPublic,
    UserType,
    IUserCreate,
    IUserUpdate,
    IUserDelete,
    IUserDTO
};
