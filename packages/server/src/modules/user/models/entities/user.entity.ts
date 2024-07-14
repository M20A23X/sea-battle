import {
    Column,
    CreateDateColumn,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn
} from 'typeorm';
import { IUser } from '#shared/types/interfaces';
import { Format } from '#shared/static/format';
import { getMySqlDate } from '#/utils';

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

    @Column({ type: 'varchar', nullable: true, length: Format.path.maxLength })
    public imgPath: string | null;

    @Column({ type: 'int', default: 0 })
    public version: number;

    @UpdateDateColumn({ type: 'timestamp', default: getMySqlDate() })
    public updatedAt: Date;

    @Column({ type: 'timestamp', default: getMySqlDate() })
    public passwordUpdatedAt: Date;

    @CreateDateColumn({ type: 'timestamp' })
    public createdAt: Date;

    @Column({ type: 'boolean', default: false })
    public confirmed: boolean;

    public set setPassword(password: string) {
        this.updateVersion();
        this.passwordUpdatedAt = this._updateUpdatedAt();
    }

    public confirm(): void {
        this.confirmed = true;
        this._updateUpdatedAt();
    }

    public updateVersion(): void {
        this.version++;
        this._updateUpdatedAt();
    }

    private _updateUpdatedAt(): Date {
        this.updatedAt = new Date();
        return this.updatedAt;
    }
}

export { UserEntity };
