import { Inject, Injectable } from '@nestjs/common';

import {
    PromiseRes,
    Res,
    MessagePayload,
    ServiceCode
} from 'shared/types/requestResponse';
import {
    getServiceCode,
    requireGetRes
} from 'shared/utils/requestResponse.util';
import {
    IUser,
    UserCreateData,
    UserPublicData,
    UserUpdateData
} from 'shared/types/user';

import { ReadType } from 'types/user';
import {
    IUserRepository,
    TUserReadDbQualifier,
    UserRepository
} from 'repositories/user.repository';
import { hashPassword } from 'utils/hashPassword.util';

export interface IUserService {
    createUser(data: UserCreateData): PromiseRes;

    readUsers<T extends boolean>(
        qualifier: TUserReadDbQualifier,
        requirePrivate: T,
        precise?: boolean
    ): PromiseRes<ReadType<T>[]>;

    updateUser(data: UserUpdateData): PromiseRes<UserPublicData>;

    deleteUser(uuid: string, currentPassword: string): PromiseRes;

    checkPassword(
        user: string | IUser,
        currentPassword: string
    ): Promise<boolean>;
}

@Injectable()
export class UserService implements IUserService {
    constructor(
        @Inject(UserRepository)
        private readonly _userRepository: IUserRepository
    ) {}

    ///--- Private ---///
    private readonly _requireGetRes = requireGetRes(UserService.name);

    ///--- Public ---///
    public async checkPassword(
        user: string | IUser,
        currentPassword: string
    ): Promise<boolean> {
        let checkUser: IUser;

        if (typeof user === 'string') {
            const readRes: Res<IUser[]> = await this.readUsers(user, true);
            const [readUser]: IUser[] = readRes.payload || [];
            checkUser = readUser;
        } else checkUser = user;

        return checkUser.password === hashPassword(currentPassword);
    }

    public async createUser(data: UserCreateData): PromiseRes {
        const [getSuccessRes, getUnSuccessRes] = this._requireGetRes('CREATE');
        const { passwordConfirm: _, password, ...publicData } = data;
        const { username } = data;

        const insertData: Omit<UserCreateData, 'passwordConfirm'> = {
            ...publicData,
            password: hashPassword(password)
        };
        try {
            await this._userRepository.insertUser(insertData);
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode, { username });
        }

        return getSuccessRes({ username });
    }

    public async readUsers<T extends boolean>(
        qualifier: TUserReadDbQualifier,
        requirePrivate: T,
        precise = false
    ): PromiseRes<ReadType<T>[]> {
        const [getSuccessRes, getUnSuccessRes] = this._requireGetRes('READ');

        let readResRaw: any;
        try {
            readResRaw = await this._userRepository.readUsers(
                qualifier,
                requirePrivate,
                precise
            );
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode);
        }

        const isArray: boolean = readResRaw instanceof Array;
        if (!isArray) throw getUnSuccessRes('UNEXPECTED_DB_ERROR');
        let readRes = readResRaw as any[];
        if (!readRes.length) {
            const resPayload: MessagePayload =
                typeof qualifier === 'string' ? { qualifier } : undefined;
            throw getUnSuccessRes('NOT_FOUND', resPayload);
        }

        const isCorrect: boolean =
            typeof readResRaw?.[0]?.userUUID === 'string';
        if (!isCorrect) throw getUnSuccessRes('UNEXPECTED_DB_ERROR');
        readRes = readResRaw as ReadType<T>[];

        return getSuccessRes({ amount: readRes.length }, readRes);
    }

    public async updateUser(data: UserUpdateData): PromiseRes<UserPublicData> {
        const [getSuccessRes, getUnSuccessRes] = this._requireGetRes('UPDATE');
        const {
            currentPassword,
            passwordConfirm: _,
            ...userUpdateDbData
        } = data;

        const { userUUID: uuid } = data;
        const checkPasswordRes: boolean = await this.checkPassword(
            uuid,
            currentPassword
        );
        if (!checkPasswordRes)
            throw getUnSuccessRes('PASSWORDS_DONT_MATCH', { uuid });

        try {
            await this._userRepository.updateUser(userUpdateDbData);
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode);
        }

        const readRes: Res<UserPublicData[]> = await this.readUsers(
            uuid,
            false
        );
        const [updatedUser]: UserPublicData[] = readRes.payload || [];
        return getSuccessRes({ uuid }, updatedUser);
    }

    public async deleteUser(uuid: string, currentPassword: string): PromiseRes {
        const [getSuccessRes, getUnSuccessRes] = this._requireGetRes('DELETE');

        const checkPasswordRes: boolean = await this.checkPassword(
            uuid,
            currentPassword
        );
        if (!checkPasswordRes)
            throw getUnSuccessRes('PASSWORDS_DONT_MATCH', { uuid });

        try {
            await this._userRepository.deleteUser(uuid);
        } catch (error: unknown) {
            const serviceCode: ServiceCode | undefined = getServiceCode(error);
            if (!serviceCode) throw error;
            throw getUnSuccessRes(serviceCode);
        }

        return getSuccessRes({ uuid });
    }
}
