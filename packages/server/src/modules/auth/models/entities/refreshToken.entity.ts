import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    Unique
} from 'typeorm';
import { IsDate, IsIP } from 'class-validator';

import { IRefreshToken } from 'shared/types/auth';

import { User } from 'modules/user/models/entities/user.entity';

@Entity({ name: 'tbl_refresh_tokens' })
export class RefreshToken implements IRefreshToken {
    @PrimaryColumn({
        primaryKeyConstraintName: 'refreshTokens_PK_token',
        type: 'uuid'
    })
    public token: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @Column({
        type: 'int',
        foreignKeyConstraintName: 'users_FK_userId'
    })
    @JoinColumn({ name: 'userId' })
    @Unique('refreshTokens_UQ_userId', ['userId'])
    public userId: number;

    @Column({ type: 'varchar' })
    @IsIP('6')
    public accessIpv6: string;

    @Column({ type: 'datetime' })
    @IsDate()
    public expirationDateTime: Date;
}
