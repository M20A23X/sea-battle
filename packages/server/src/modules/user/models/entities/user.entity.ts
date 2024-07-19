import {
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    Unique
} from 'typeorm';
import { IUser, IUserCredentials } from '#shared/types/interfaces';
import { Format } from '#shared/static/format';
import { UserCredentialsEmbeddable } from '#/modules/user/models/entities/embeddables/UserCredentials.embeddable';

//--- UserEntity -----------
@Entity({ name: 'tbl_users' })
class UserEntity implements IUser {
    @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'users_PK_userId' })
    public readonly userId: number;
    @Column({ type: 'uuid' })
    @Generated('uuid')
    public readonly uuid: string;

    @Column({ type: 'varchar' })
    @Unique('users_UQ_email', ['email'])
    public email: string;

    @Column({ type: 'varchar', length: Format.username.maxLength })
    @Unique('users_UQ_username', ['username'])
    public username: string;

    @Column({ type: 'varchar', length: Format.password.maxLength })
    public password: string;

    @Column({ type: 'varchar', nullable: true, length: Format.path.maxLength })
    public imgPath: string | null;

    @Column(() => UserCredentialsEmbeddable)
    public readonly credentials: IUserCredentials;

    public static updatePassword(entity: UserEntity, password: string): void {
        entity.password = password;
        entity.credentials.passwordUpdatedAt = new Date();
    }

    public static updateVersion(entity: UserEntity, date?: Date): void {
        entity.credentials.version++;
        entity.credentials.updatedAt = date ?? new Date();
    }
}

export { UserEntity };
