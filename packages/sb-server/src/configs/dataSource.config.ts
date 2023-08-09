import * as process from 'process';
import { Provider } from '@nestjs/common';

import { DataSource } from 'typeorm';
import { ILoggerService, LoggerService } from 'services/logger.service';

export const DataSourceProvider: Provider = {
    provide: DataSource,
    useFactory: async () => {
        const loggerService: ILoggerService = new LoggerService(
            'DataSourceProvider',
        );
        const dataSource: DataSource = new DataSource({
            type: 'mysql',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || ''),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            entities: [],
            synchronize: true,
        });
        loggerService.debug(dataSource.options);

        try {
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
