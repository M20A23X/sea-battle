import { IHealthConfig } from '#shared/types';
import { Default as DefaultShared } from '#shared/static';

export default (): IHealthConfig => ({
    health: {
        databaseCheckTimeout: parseInt(
            process.env.DATABASE_CHECK_TIMEOUT ??
                '' + DefaultShared.health.databaseCheckTimeout
        ),
        diskThreshold: parseFloat(
            process.env.DISK_THRESHOLD ??
                '' + DefaultShared.health.diskThreshold
        ),
        memHeapThreshold: parseInt(
            process.env.MEM_HEAP_THRESHOLD ??
                '' + DefaultShared.health.memHeapThreshold
        ),
        memRSSThreshold: parseInt(
            process.env.MEM_RSS_THRESHOLD ??
                '' + DefaultShared.health.memRSSThreshold
        )
    }
});
