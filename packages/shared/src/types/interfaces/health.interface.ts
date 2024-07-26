interface IHealthConfig {
    databaseCheckTimeout: number;
    diskThreshold: number;
    memHeapThreshold: number;
    memRSSThreshold: number;
}
type IHealthDefault = IHealthConfig;

export { IHealthConfig, IHealthDefault };
