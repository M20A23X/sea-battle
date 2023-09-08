import { Inject, Injectable } from '@nestjs/common';

import {
    ServiceCode,
    ServicePromiseRes,
    ServiceRes,
} from 'shared/types/requestResponse';
import {
    IUser,
    IUserCreateData,
    IUserPublicData,
    IUserUpdateData,
} from 'shared/types/user';

import { LoggerService } from './logger.service';

import { hashPassword } from 'utils/hashPassword.util';
import { requireGetServiceRes } from 'utils/res.util';

import { User } from 'modules/user/models/entities/user.entity';

import {
    IUsersRepository,
    TUserReadDbQualifier,
    UsersRepository,
} from 'repositories/users.repository';

export interface IUsersService {
    createUser(data: IUserCreateData): ServicePromiseRes;

    readUsers<T extends boolean>(
        qualifier: TUserReadDbQualifier,
        requirePrivate: T,
        precise?: boolean,
    ): ServicePromiseRes<Array<T extends true ? IUser : IUserPublicData>>;

    updateUser(data: IUserUpdateData): ServicePromiseRes<IUserPublicData>;

    deleteUser(uuid: string, currentPassword: string): ServicePromiseRes;

    checkPassword(
        user: string | IUser,
        currentPassword: string,
    ): ServicePromiseRes<boolean | null>;
}

@Injectable()
export class UsersService implements IUsersService {
    constructor(
        @Inject(UsersRepository)
        private readonly _userRepository: IUsersRepository,
    ) {}

    ///--- Private ---///
    private readonly _requireGetRes = requireGetServiceRes(
        User.name,
        new LoggerService(UsersService.name),
    );

    ///--- Public ---///
    public async checkPassword(
        user: string | IUser,
        currentPassword: string,
    ): ServicePromiseRes<boolean | null> {
        const getRes = this._requireGetRes('CHECK');
        let checkUser: IUser;

        if (typeof user === 'string') {
            const readRes: ServiceRes<IUser[]> = await this.readUsers(
                user,
                true,
            );
            const [readUser]: IUser[] = readRes.payload || [];
            if (!readUser || !readRes.isSuccess)
                return getRes({ serviceCode: readRes.serviceCode });

            checkUser = readUser;
        } else checkUser = user;

        const isEqual: boolean =
            checkUser.password === hashPassword(currentPassword);

        return getRes({
            serviceCode: isEqual ? 'SUCCESS' : 'PASSWORDS_DONT_MATCH',
            payload: isEqual,
        });
    }

    public async createUser(data: IUserCreateData): ServicePromiseRes {
        const getRes = this._requireGetRes('CREATE');
        const { passwordConfirm: _, password, ...publicData } = data;
        const { username } = data;

        try {
            await this._userRepository.insertUser({
                ...publicData,
                password: hashPassword(password),
            });
            return getRes({ messageRaw: { username } });
        } catch (error: unknown) {
            return getRes({ error, messageRaw: { username } });
        }
    }

    public async readUsers<T extends boolean>(
        qualifier: TUserReadDbQualifier,
        requirePrivate: T,
        precise = false,
    ): ServicePromiseRes<Array<T extends true ? IUser : IUserPublicData>> {
        const getRes = this._requireGetRes('READ');
        try {
            const selectRes: Array<T extends true ? IUser : IUserPublicData> =
                await this._userRepository.readUsers<T>(
                    qualifier,
                    requirePrivate,
                    precise,
                );
            if (!selectRes.length) return getRes({ serviceCode: 'NOT_FOUND' });

            return getRes({
                messageRaw: { amount: selectRes.length },
                payload: selectRes,
            });
        } catch (error: unknown) {
            return getRes({ error, messageRaw: { qualifier } });
        }
    }

    public async updateUser(
        data: IUserUpdateData,
    ): ServicePromiseRes<IUserPublicData> {
        const getRes = this._requireGetRes('UPDATE');
        const {
            currentPassword,
            passwordConfirm: _,
            ...userUpdateDbData
        } = data;
        const { userUUID: uuid } = data;
        try {
            const checkPasswordRes: ServiceRes<boolean> =
                await this.checkPassword(uuid, currentPassword);
            if (!checkPasswordRes.isSuccess) {
                const serviceCode: ServiceCode = checkPasswordRes.serviceCode;
                return getRes({ serviceCode, messageRaw: { uuid } });
            }

            await this._userRepository.updateUser(userUpdateDbData);
            const readRes: ServiceRes<IUserPublicData[]> = await this.readUsers(
                uuid,
                false,
            );
            const [updatedUser]: IUserPublicData[] = readRes.payload || [];
            if (!updatedUser || !readRes.isSuccess) {
                return getRes({
                    serviceCode: readRes.serviceCode,
                    messageRaw: { uuid },
                });
            }
            return getRes({ messageRaw: { uuid }, payload: updatedUser });
        } catch (error: unknown) {
            return getRes({ error, messageRaw: { uuid } });
        }
    }

    public async deleteUser(
        uuid: string,
        currentPassword: string,
    ): ServicePromiseRes {
        const getRes = this._requireGetRes('DELETE');
        try {
            const checkPasswordRes: ServiceRes<boolean> =
                await this.checkPassword(uuid, currentPassword);
            if (!checkPasswordRes.isSuccess) {
                return getRes({
                    serviceCode: checkPasswordRes.serviceCode,
                    messageRaw: { uuid },
                });
            }

            await this._userRepository.deleteUser(uuid);
            return getRes({ messageRaw: { uuid } });
        } catch (error: unknown) {
            return getRes({ error, messageRaw: { uuid } });
        }
    }
}
