import process from 'process';
import { Provider } from '@nestjs/common';

import { DataSource } from 'typeorm';
import { EnvError } from 'exceptions/EnvError';
import { ILoggerService, LoggerService } from 'services/logger.service';

import { ENTITIES } from 'static/entities';
import {
    DATABASE_IP,
    DATABASE_NAME,
    DATABASE_PORT,
    NODE_ENV_PROD,
} from 'static/common';

export const DataSourceProvider: Provider = {
    provide: DataSource,
    useFactory: async () => {
        const loggerService: ILoggerService = new LoggerService(
            'DataSourceProvider',
        );

        const dataSource: DataSource = new DataSource({
            type: 'mysql',
            host: process.env.DATABASE_IP || DATABASE_IP,
            port: parseInt(process.env.DATABASE_PORT || '') || DATABASE_PORT,
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME || DATABASE_NAME,
            entities: ENTITIES,
            synchronize: process.env.NODE_ENV !== NODE_ENV_PROD,
        });
        loggerService.debug(dataSource.options);

        try {
            const databasePasswordSalt: string | undefined =
                process.env.DATABASE_PASSWORD_SALT;
            if (!databasePasswordSalt)
                throw new EnvError('Database password salt is not set!');

            const jwtSecret: string | undefined = process.env.JWT_SECRET;
            if (!jwtSecret) throw new EnvError('JWT secret is not set!');

            await dataSource.initialize();
            if (dataSource.isInitialized)
                loggerService.log('Successfully initialize datasource');
            else loggerService.error('Error initialize datasource!');
        } catch (error: unknown) {
            if (error instanceof Error) {
                const errMsg = `Error initialize datasource: ${error.message}`;
                loggerService.error(errMsg);
            }
        }
        return dataSource;
    },
};
