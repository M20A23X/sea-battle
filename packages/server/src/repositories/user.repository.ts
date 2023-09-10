import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
    DataSource,
    DeleteQueryBuilder,
    DeleteResult,
    InsertQueryBuilder,
    InsertResult,
    Repository,
    SelectQueryBuilder,
    UpdateQueryBuilder,
    UpdateResult,
} from 'typeorm';

import {
    IUser,
    IUserCreateData,
    IUsersReadData,
    IUserUpdateData,
} from 'shared/types/user';

import { FALLBACK, USERS_SCHEMA } from 'static/format';

import { ILoggerService, LoggerService } from 'services/logger.service';

import { User } from 'modules/user/models/entities/user.entity';

export type TUserReadDbQualifier =
    | string
    | Pick<IUsersReadData, 'startId' | 'endId'>;
export type TUserCreateDbData = Omit<IUserCreateData, 'passwordConfirm'>;
export type TUserUpdateDbData = Omit<
    IUserUpdateData,
    'passwordConfirm' | 'currentPassword'
>;

export interface IUserRepository {
    insertUser(data: TUserCreateDbData): Promise<void>;

    readUsers(
        qualifier: TUserReadDbQualifier,
        requirePrivate: boolean,
        precise: boolean,
    ): Promise<any>;

    updateUser(data: TUserUpdateDbData): Promise<void>;

    deleteUser(uuid: string): Promise<void>;
}

@Injectable()
export class UserRepository
    extends Repository<User>
    implements IUserRepository
{
    constructor(@InjectDataSource() private _dataSource: DataSource) {
        super(User, _dataSource.createEntityManager());
    }

    ///--- Private ---///
    private readonly _loggerService: ILoggerService = new LoggerService(
        UserRepository.name,
    );

    ///--- Public ---///
    public async insertUser(userCreateData: TUserCreateDbData): Promise<void> {
        const insertQuery: InsertQueryBuilder<IUser> = this.createQueryBuilder()
            .insert()
            .values(userCreateData);
        this._loggerService.debug(insertQuery.getQueryAndParameters());

        const insertRes: InsertResult = await insertQuery.execute();
        this._loggerService.debug(
            'New entity id: ' + JSON.stringify(insertRes.identifiers),
        );
    }

    public async readUsers(
        qualifier: TUserReadDbQualifier,
        requirePrivate: boolean,
        precise: boolean,
    ): Promise<any> {
        const selectPart =
            'u.username, u.userUUID, u.imgUrl' +
            (requirePrivate ? ', u.userId, u.password' : '');
        let selectQuery: SelectQueryBuilder<IUser> =
            this.createQueryBuilder('u').select(selectPart);
        if (typeof qualifier === 'string') {
            const isUsername: boolean =
                USERS_SCHEMA.username.regex.test(qualifier);
            const whereUsername: string = precise
                ? '= :qualifier'
                : `LIKE '%${qualifier}%'`;
            selectQuery = selectQuery.where(
                isUsername
                    ? `u.username ${whereUsername}`
                    : `u.userUUID = :qualifier`,
                { qualifier },
            );
        } else {
            const { startId, endId } = qualifier;
            selectQuery = selectQuery.where(
                'u.userId BETWEEN :startId AND :endId',
                {
                    startId,
                    endId: endId ?? FALLBACK.maxReadAmount,
                },
            );
        }

        this._loggerService.debug(selectQuery.getQueryAndParameters());
        return selectQuery.execute();
    }

    public async updateUser(data: TUserUpdateDbData): Promise<void> {
        const { userUUID, ...dbData } = data;
        const updateQuery: UpdateQueryBuilder<IUser> = this.createQueryBuilder()
            .update()
            .set(dbData)
            .where({ userUUID });
        this._loggerService.debug(updateQuery.getQueryAndParameters());

        const updateRes: UpdateResult = await updateQuery.execute();
        this._loggerService.debug('Affected rows: ' + updateRes.affected);
    }

    public async deleteUser(uuid: string): Promise<void> {
        const deleteQuery: DeleteQueryBuilder<IUser> = this.createQueryBuilder(
            'u',
        )
            .delete()
            .where({ userUUID: uuid });
        this._loggerService.debug(deleteQuery.getQueryAndParameters());

        const deleteRes: DeleteResult = await deleteQuery.execute();
        this._loggerService.debug('Affected rows: ' + deleteRes.affected);
    }
}
