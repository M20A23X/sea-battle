interface IUserId {
    userId: number;
}
interface IUuid {
    uuid: string;
}
interface IEmail {
    email: string;
}
interface IImgPath {
    imgPath: string | null;
}
interface IUsername {
    username: string;
}

interface IPassword {
    password: string;
}
interface IPasswordSet {
    passwordSet: IPassword & {
        passwordConfirm: string;
    };
}

interface IIdRange {
    startId: number;
    endId?: number;
}

export {
    IUserId,
    IUuid,
    IUsername,
    IEmail,
    IPassword,
    IImgPath,
    IPasswordSet,
    IIdRange
};
