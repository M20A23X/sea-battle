import { DataSource, Repository, UpdateResult } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { ConsoleLogger, Injectable } from '@nestjs/common';

import { IUser } from '#shared/types/interfaces';
import { UserEntity } from '#/modules/user';

@Injectable()
class UserRepository extends Repository<UserEntity> {
    // --- Constructor -------------------------------------------------------------
    constructor(@InjectDataSource() private _dataSource: DataSource) {
        super(UserEntity, _dataSource.createEntityManager());
    }

    //--- updateEntity -----------
    public async updateEntity(
        user: IUser,
        logger: ConsoleLogger
    ): Promise<UpdateResult> {
        logger.log('Updating the user entity...');
        logger.debug({ user });

        if (user.credentials.passwordUpdatedAt !== user.credentials.updatedAt)
            UserEntity.updateVersion(user, user.credentials.passwordUpdatedAt);
        else UserEntity.updateVersion(user);

        return await this.update({ uuid: user.uuid }, user);
    }
}

export { UserRepository };
