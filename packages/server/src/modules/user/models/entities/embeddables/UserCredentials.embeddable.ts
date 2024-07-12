import { Column } from 'typeorm';
import { IUserCredentialsEmbeddable } from '#shared/types/interfaces';
import { Format } from '#shared/static/format';

//--- UserCredentialsEmbeddable -----------
class UserCredentialsEmbeddable implements IUserCredentialsEmbeddable {
    @Column({ type: 'int', default: 0 })
    public version: number;

    @Column({
        type: 'varchar',
        length: Format.password.maxLength
    })
    public lastPassword: string;

    @Column({ type: 'datetime', default: Date.now() })
    public passwordUpdatedAt: number;

    @Column({ type: 'datetime', default: Date.now() })
    public updatedAt: number;

    @Column({ type: 'datetime', default: Date.now() })
    public createdAt: number;

    @Column({ type: 'boolean', default: false })
    public confirmed: boolean;

    public setConfirmed(): void {
        this.confirmed = true;
        this._updateUpdatedAt();
    }

    public updatePassword(password: string): void {
        this.version++;
        this.lastPassword = password;
        this.passwordUpdatedAt = this._updateUpdatedAt();
    }

    public updateVersion(): void {
        this.version++;
        this._updateUpdatedAt();
    }

    private _updateUpdatedAt(): number {
        this.updatedAt = Date.now();
        return this.updatedAt;
    }
}

export { UserCredentialsEmbeddable };
