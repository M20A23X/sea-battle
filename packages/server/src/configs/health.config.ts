import { getEnvFloat } from '#shared/utils';
import { IConfig } from '#/types';
import { Config } from '#/static';

export default (): Pick<IConfig, 'health'> => ({
    health: {
        databaseCheckTimeout: getEnvFloat(
            'DATABASE_CHECK_TIMEOUT',
            Config.health.databaseCheckTimeout
        ),
        diskThreshold: getEnvFloat(
            'DISK_THRESHOLD',
            Config.health.diskThreshold
        ),
        memHeapThreshold: getEnvFloat(
            'MEM_HEAP_THRESHOLD',
            Config.health.memHeapThreshold
        ),
        memRSSThreshold: getEnvFloat(
            'MEM_RSS_THRESHOLD',
            Config.health.memRSSThreshold
        )
    }
});
