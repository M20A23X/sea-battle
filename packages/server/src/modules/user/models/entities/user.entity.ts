import {
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    Unique
} from 'typeorm';
import { IUserCredentialsEmbeddable, IUser } from '#shared/types/interfaces';
import { Format } from '#shared/static/format';
import { UserCredentialsEmbeddable } from '#/modules/user';

//--- UserEntity -----------
@Entity({ name: 'tbl_users' })
class UserEntity implements IUser {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_PK_userId' })
    public userId: number;
    @Column({ type: 'uuid' })
    @Generated('uuid')
    public uuid: string;

    @Column({ type: 'varchar' })
    @Unique('users_UQ_email', ['email'])
    public email: string;
    @Column({ type: 'varchar', length: Format.username.maxLength })
    @Unique('users_UQ_username', ['username'])
    public username: string;

    @Column({ type: 'varchar', length: Format.password.maxLength })
    public password: string;
    @Column(() => UserCredentialsEmbeddable)
    public credentials: IUserCredentialsEmbeddable;

    @Column({ type: 'varchar', nullable: true, length: Format.path.maxLength })
    public imgPath: string | null;
}

export { UserEntity };
