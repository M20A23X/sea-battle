import { getEnvFloat } from '#shared/utils';
import { IConfig } from '#/types';
import { Config } from '#/static';

export default (): Pick<IConfig, 'health'> => ({
    health: {
        databaseConnectionCheckTimeoutMs: getEnvFloat(
            'DATABASE_CONNECTION_CHECK_TIMEOUT_MS',
            Config.health.databaseConnectionCheckTimeoutMs
        ),
        diskThresholdPercent: getEnvFloat(
            'SERVER_HEALTH_DISK_THRESHOLD_PERCENT',
            Config.health.diskThresholdPercent
        ),
        memHeapThresholdB: getEnvFloat(
            'SERVER_HEALTH_MEM_HEAP_THRESHOLD_B',
            Config.health.memHeapThresholdB
        ),
        memRSSThresholdB: getEnvFloat(
            'SERVER_HEALTH_MEM_RSS_THRESHOLD_B',
            Config.health.memRSSThresholdB
        )
    }
});
