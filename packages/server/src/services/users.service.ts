import { Inject, Injectable } from '@nestjs/common';

import { TPromiseResponse, TResponse } from 'shared/types/requestResponse';
import {
    IUser,
    IUserCreateData,
    IUserPublicData,
    IUserUpdateData,
} from 'shared/types/user';
import {
    IResponseService,
    ResponseService,
    TCrudType,
} from 'services/response.service';
import {
    IUsersRepository,
    TUserReadDbQualifier,
    UsersRepository,
} from 'repositories/users.repository';

import { hashPassword } from 'utils/hashPassword.util';

export interface IUsersService {
    createUser(data: IUserCreateData): TPromiseResponse;

    readUsers(
        qualifier: TUserReadDbQualifier,
    ): TPromiseResponse<IUserPublicData[]>;

    updateUser(data: IUserUpdateData): TPromiseResponse<IUserPublicData>;

    deleteUser(uuid: string, currentPassword: string): TPromiseResponse;
}

@Injectable()
export class UsersService implements IUsersService {
    constructor(
        @Inject(UsersRepository)
        private readonly _userRepository: IUsersRepository,
    ) {}

    ///--- Private ---///
    private readonly _resService: IResponseService = new ResponseService(
        UsersService.name,
    );

    private async _checkCurrentPassword<P>(
        uuid: string,
        currentPassword: string,
        crudType: TCrudType,
    ): Promise<TResponse<P> | void> {
        const userData: IUser[] = (await this._userRepository.readUsers(
            uuid,
            true,
        )) as IUser[];
        if (!userData.length) {
            return this._resService.getWarnRes(crudType, 'DOESNT_EXIST', {
                UUID: uuid,
            });
        }
        const { password }: IUser = userData[0] as IUser;
        if (password !== hashPassword(currentPassword))
            return this._resService.getWarnRes(crudType, 'INCORRECT_PASSWORD');
    }

    ///--- Public ---///
    public async createUser(data: IUserCreateData): TPromiseResponse {
        const { passwordConfirm: _, password, ...publicData } = data;

        try {
            await this._userRepository.insertUser({
                ...publicData,
                password: hashPassword(password),
            });

            return this._resService.getSuccessRes('CREATE', {
                username: data.username,
            });
        } catch (error: unknown) {
            return this._resService.getWarnRes('CREATE', error);
        }
    }

    public async readUsers(
        qualifier: TUserReadDbQualifier,
    ): TPromiseResponse<IUserPublicData[]> {
        try {
            const selectRes: IUserPublicData[] =
                await this._userRepository.readUsers(qualifier);
            return this._resService.getSuccessRes(
                'READ',
                { amount: selectRes.length },
                selectRes,
            );
        } catch (error: unknown) {
            return this._resService.getWarnRes('READ', error);
        }
    }

    public async updateUser(
        data: IUserUpdateData,
    ): TPromiseResponse<IUserPublicData> {
        const {
            currentPassword,
            passwordConfirm: _,
            ...userUpdateDbData
        } = data;
        const { userUUID } = data;

        try {
            const currentPasswordRes: void | TResponse<IUserPublicData> =
                await this._checkCurrentPassword<IUserPublicData>(
                    userUUID,
                    currentPassword,
                    'UPDATE',
                );
            if (typeof currentPasswordRes === 'object')
                return currentPasswordRes;

            await this._userRepository.updateUser(userUpdateDbData);

            const { payload } = await this.readUsers(userUUID);
            if (payload === null)
                return this._resService.getWarnRes('UPDATE', 'DOESNT_EXIST');
            const editedUser: IUserPublicData = payload[0];
            return this._resService.getSuccessRes(
                'UPDATE',
                { UUID: userUUID },
                editedUser,
            );
        } catch (error: unknown) {
            return this._resService.getWarnRes('UPDATE', error);
        }
    }

    public async deleteUser(
        uuid: string,
        currentPassword: string,
    ): TPromiseResponse {
        try {
            const currentPasswordRes: void | TResponse =
                await this._checkCurrentPassword(
                    uuid,
                    currentPassword,
                    'DELETE',
                );
            if (typeof currentPasswordRes === 'object')
                return currentPasswordRes;

            await this._userRepository.deleteUser(uuid);
            return this._resService.getSuccessRes('DELETE', { UUID: uuid });
        } catch (error: unknown) {
            return this._resService.getWarnRes('DELETE', error);
        }
    }
}
