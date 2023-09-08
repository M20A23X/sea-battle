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
} from 'typeorm';

import { IRefreshToken } from 'shared/types/auth';
import { ILoggerService, LoggerService } from 'services/logger.service';

import { RefreshToken } from 'modules/auth/models/entities/refreshToken.entity';

export interface IRefreshTokenRepository {
    insertToken(token: IRefreshToken): Promise<void>;

    readToken(qualifier: string | number): Promise<IRefreshToken>;

    deleteToken(token: string): Promise<void>;
}

@Injectable()
export class RefreshTokenRepository
    extends Repository<RefreshToken>
    implements IRefreshTokenRepository
{
    constructor(@InjectDataSource() private _dataSource: DataSource) {
        super(RefreshToken, _dataSource.createEntityManager());
    }

    ///--- Private ---///
    private readonly _loggerService: ILoggerService = new LoggerService(
        RefreshTokenRepository.name,
    );

    ///--- Public ---///
    public async insertToken(token: IRefreshToken): Promise<void> {
        const insertQuery: InsertQueryBuilder<IRefreshToken> =
            this.createQueryBuilder().insert().values(token);
        this._loggerService.debug(insertQuery.getQueryAndParameters());
        const insertRes: InsertResult = await insertQuery.execute();
        this._loggerService.debug(
            'New entity id: ' + JSON.stringify(insertRes.identifiers),
        );
    }

    public async readToken(qualifier: string | number): Promise<IRefreshToken> {
        const whereClause: string = (
            typeof qualifier === 'number' ? 'r.userId' : 'r.token'
        ).concat(' = :qualifier');
        const selectQuery: SelectQueryBuilder<IRefreshToken> =
            this.createQueryBuilder('r')
                .select('r.token, r.userId, r.accessIpv6, r.expirationDateTime')
                .where(whereClause, { qualifier });
        this._loggerService.debug(selectQuery.getQueryAndParameters());
        return selectQuery.execute();
    }

    public async deleteToken(token: string): Promise<void> {
        const deleteQuery: DeleteQueryBuilder<IRefreshToken> =
            this.createQueryBuilder().delete().where({ token });
        this._loggerService.debug(deleteQuery.getQueryAndParameters());

        const deleteRes: DeleteResult = await deleteQuery.execute();
        this._loggerService.debug('Affected rows: ' + deleteRes.affected);
    }
}
