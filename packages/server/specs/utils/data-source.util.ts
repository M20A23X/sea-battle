import { DataSource } from 'typeorm';
import { EntityTarget } from 'typeorm/common/EntityTarget';
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral';

const waitDataSource = async (
    dataSource: DataSource,
    connectionCheckIntervalMs: number
): Promise<void> => {
    return new Promise<void>((resolve) => {
        const interval: NodeJS.Timeout = setInterval(() => {
            if (dataSource.isInitialized) {
                clearInterval(interval);
                return resolve();
            }
        }, connectionCheckIntervalMs).unref();
    });
};

const truncateTable = async <E extends ObjectLiteral>(
    dataSource: DataSource,
    entity: EntityTarget<E>
): Promise<void> => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS=0');
    await dataSource.getRepository(entity).clear();
    await dataSource.query('SET FOREIGN_KEY_CHECKS=1');
};

export { waitDataSource, truncateTable };
