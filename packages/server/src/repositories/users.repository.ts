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
    IUserPublicData,
    IUsersReadData,
    IUserUpdateData,
} from 'shared/types/user';
import { ILoggerService, LoggerService } from 'services/logger.service';
import { User } from 'modules/user/models/entities/user.entity';

import { USERS_SCHEMA } from 'static/database';

export type TUserReadDbQualifier =
    | string
    | Required<Pick<IUsersReadData, 'startId' | 'endId'>>;
export type TUserCreateDbData = Omit<IUserCreateData, 'passwordConfirm'>;
export type TUserUpdateDbData = Omit<
    IUserUpdateData,
    'passwordConfirm' | 'currentPassword'
>;

export interface IUsersRepository {
    insertUser(data: TUserCreateDbData): Promise<void>;

    readUsers(
        qualifier: TUserReadDbQualifier,
        requirePrivate?: boolean,
    ): Promise<Array<IUserPublicData | IUser>>;

    updateUser(data: TUserUpdateDbData): Promise<void>;

    deleteUser(uuid: string): Promise<void>;
}

@Injectable()
export class UsersRepository
    extends Repository<IUser>
    implements IUsersRepository
{
    constructor(@InjectDataSource() private _dataSource: DataSource) {
        super(User, _dataSource.createEntityManager());
    }

    ///--- Private ---///
    private readonly _loggerService: ILoggerService = new LoggerService(
        UsersRepository.name,
    );

    ///--- Public ---///
    async insertUser(iUserCreateData: TUserCreateDbData): Promise<void> {
        const insertQuery: InsertQueryBuilder<IUser> = this.createQueryBuilder()
            .insert()
            .values(iUserCreateData);
        this._loggerService.debug(insertQuery.getQuery());
        const insertRes: InsertResult = await insertQuery.execute();
        this._loggerService.debug(
            'New entity id: ' + JSON.stringify(insertRes.identifiers),
        );
    }

    async readUsers(
        qualifier: TUserReadDbQualifier,
        requirePrivate = false,
    ): Promise<Array<IUserPublicData | IUser>> {
        const selectPart =
            'u.username, u.userUUID, u.imgUrl' +
            (requirePrivate ? ', u.userId, u.password' : '');
        let selectQuery: SelectQueryBuilder<IUser> =
            this.createQueryBuilder('u').select(selectPart);
        if (typeof qualifier === 'string') {
            const isUsername: boolean =
                USERS_SCHEMA.username.format.test(qualifier);
            selectQuery = selectQuery.where(
                isUsername
                    ? `u.username LIKE :qualifier`
                    : `u.userUUID = :qualifier`,
                { qualifier: isUsername ? `%${qualifier}%` : qualifier },
            );
        } else {
            const { startId, endId } = qualifier;
            selectQuery = selectQuery.where(
                'u.userId BETWEEN :startId AND :endId',
                {
                    startId,
                    endId,
                },
            );
        }
        this._loggerService.debug(selectQuery.getQuery());
        return selectQuery.execute();
    }

    async updateUser(data: TUserUpdateDbData): Promise<void> {
        const { userUUID, ...dbData } = data;
        if (!Object.keys(dbData).length) return;

        const updateQuery: UpdateQueryBuilder<IUser> = this.createQueryBuilder()
            .update()
            .set(dbData)
            .where({ userUUID });
        this._loggerService.debug(updateQuery.getQuery());

        const updateRes: UpdateResult = await updateQuery.execute();
        this._loggerService.debug('Affected rows: ' + updateRes.affected);
    }

    async deleteUser(uuid: string): Promise<void> {
        const deleteQuery: DeleteQueryBuilder<IUser> = this.createQueryBuilder(
            'u',
        )
            .delete()
            .where({ userUUID: uuid });
        this._loggerService.debug(deleteQuery.getQuery());

        const deleteRes: DeleteResult = await deleteQuery.execute();
        this._loggerService.debug('Affected rows: ' + deleteRes.affected);
    }
}
