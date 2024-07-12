import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';

import { UserEntity } from '#/modules/user';

@Injectable()
class UserRepository extends Repository<UserEntity> {
    constructor(@InjectDataSource() private _dataSource: DataSource) {
        super(UserEntity, _dataSource.createEntityManager());
    }
}

export { UserRepository };
