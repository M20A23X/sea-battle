import { Column, CreateDateColumn } from 'typeorm';
import { IUserCredentials } from '#shared/types/interfaces';
import { getMySqlDate } from '#/utils';

//--- UserCredentialsEmbeddable -----------
class UserCredentialsEmbeddable implements IUserCredentials {
    @Column({ type: 'int', default: 0 })
    public version: number;

    @Column({ type: 'timestamp', default: getMySqlDate() })
    public updatedAt: Date;

    @Column({ type: 'timestamp', default: getMySqlDate() })
    public passwordUpdatedAt: Date;

    @CreateDateColumn({ type: 'timestamp' })
    public readonly createdAt: Date;

    @Column({ type: 'boolean', default: false })
    public confirmed: boolean;
}

export { UserCredentialsEmbeddable };
