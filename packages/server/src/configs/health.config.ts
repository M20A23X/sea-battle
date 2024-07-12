import { IConfigBase } from '#shared/types/config';
import { ConfigBasic } from '#shared/static';
import { getEnvFloat } from '#shared/utils';

export default (): Pick<IConfigBase, 'health'> => ({
    health: {
        databaseCheckTimeout: getEnvFloat(
            'DATABASE_CHECK_TIMEOUT',
            ConfigBasic.health.databaseCheckTimeout
        ),
        diskThreshold: getEnvFloat(
            'DISK_THRESHOLD',
            ConfigBasic.health.diskThreshold
        ),
        memHeapThreshold: getEnvFloat(
            'MEM_HEAP_THRESHOLD',
            ConfigBasic.health.memHeapThreshold
        ),
        memRSSThreshold: getEnvFloat(
            'MEM_RSS_THRESHOLD',
            ConfigBasic.health.memRSSThreshold
        )
    }
});
