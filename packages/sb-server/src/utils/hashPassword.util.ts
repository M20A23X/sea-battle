import * as process from 'process';
import { hashSync } from 'bcrypt';

export const hashPassword = (password: string): string =>
    hashSync(password, process.env.DB_PASSWORD_SALT || '');
