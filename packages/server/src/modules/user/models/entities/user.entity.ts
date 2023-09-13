import {
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    Unique
} from 'typeorm';

import { IUser } from 'shared/types/user';

import { USER_ENTITY } from 'static/format';

const { username, password, imgPath } = USER_ENTITY;

@Entity({ name: 'tbl_users' })
export class User implements IUser {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_PK_userId' })
    public userId: number;

    @Column({ type: 'uuid' })
    @Generated('uuid')
    public userUUID: string;

    @Column({ type: 'varchar', length: username.maxLength })
    @Unique('users_UQ_username', ['username'])
    public username: string;

    @Column({ type: 'varchar', length: password.maxLength })
    public password: string;

    @Column({ type: 'varchar', length: imgPath.maxLength })
    public imgPath: string;
}
