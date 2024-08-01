interface IHealthConfig {
    databaseConnectionCheckTimeoutMs: number;
    diskThresholdPercent: number;
    memHeapThresholdB: number;
    memRSSThresholdB: number;
}
type IHealthDefault = IHealthConfig;

export { IHealthConfig, IHealthDefault };
