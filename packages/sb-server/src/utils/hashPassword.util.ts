import { hashSync } from 'bcrypt';

export const hashPassword = (password: string): string =>
    hashSync(password, process.env.DATABASE_PASSWORD_SALT || '');
