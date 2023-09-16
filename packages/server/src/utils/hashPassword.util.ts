import { hashSync } from 'bcryptjs';

export const hashPassword = (password: string): string =>
    hashSync(password, process.env.DATABASE_PASSWORD_SALT || '');
