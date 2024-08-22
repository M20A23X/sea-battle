import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

type DatasourceDefault = Required<
    Pick<
        MysqlConnectionOptions,
        'type' | 'host' | 'port' | 'database' | 'synchronize'
    >
>;

interface IDatabaseConfig {
    datasource: MysqlConnectionOptions;
    limitFallback: number;
    passwordSecret: string;
}

interface IDatabaseDefault extends Pick<IDatabaseConfig, 'limitFallback'> {
    datasource: DatasourceDefault;
}

export { IDatabaseConfig, IDatabaseDefault };
