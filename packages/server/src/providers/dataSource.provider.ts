import { ConsoleLogger } from '@nestjs/common';
import { FactoryProvider } from '@nestjs/common/interfaces/modules/provider.interface';
import { DataSource } from 'typeorm';

import { EnvException } from '#shared/exceptions';
import { DatabaseConfig } from '#/configs';
import { Entities } from '#/modules/entities';

const DataSourceProvider: FactoryProvider<DataSource> = {
    provide: DataSource,
    useFactory: async (): Promise<DataSource> => {
        const logger: ConsoleLogger = new ConsoleLogger(DataSource.name);
        logger.log('Initializing a datasource...');

        const dataSource: DataSource = new DataSource({
            ...DatabaseConfig().database.datasource,
            entities: Entities
        });
        logger.debug(dataSource.options);

        try {
            await dataSource.initialize();
            if (dataSource.isInitialized) {
                const message = 'Successfully initialized a datasource';
                logger.log(message);
            } else logger.error("Can't initialize a datasource!");
        } catch (error: unknown) {
            if (error instanceof Error) {
                const message = `Can't initialize a datasource: ${error.message}`;
                throw new EnvException(message);
            } else throw error;
        }
        return dataSource;
    }
};

export { DataSourceProvider };
