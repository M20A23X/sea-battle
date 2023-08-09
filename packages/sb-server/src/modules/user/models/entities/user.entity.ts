import {
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

import { TRequest } from 'types/requestResponse';

import { USERS_SCHEMA } from 'static/database';

const { username, password, imgUrl } = USERS_SCHEMA;

export interface IUser {
    userId: number;
    userUUID: string;
    username: string;
    password: string;
    imgUrl: string;
}

export type IUserPublicData = Omit<IUser, 'userId' | 'password'>;
export type TUserReqDTO<V> = TRequest<`user`, V>;

@Entity({ name: 'tbl_users' })
export class User implements IUser {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_PK_userId' })
    public userId = 0;

    @Column({ type: 'uuid' })
    @Generated('uuid')
    public userUUID = '';

    @Column({ type: 'varchar', length: username.maxLength })
    @Unique('users_UQ_username', ['username'])
    public username = '';

    @Column({ type: 'varchar', length: password.maxLength })
    public password = '';

    @Column({ type: 'varchar', length: imgUrl.maxLength })
    public imgUrl = '';
}
