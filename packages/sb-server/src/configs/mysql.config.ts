import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

export const MYSQL_CONFIG: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    useFactory: async () => ({
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || ''),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [
            process.cwd() + '/dist/modules/*/models/entities/*.entity.{js,ts}',
        ],
        synchronize: false,
    }),
};
