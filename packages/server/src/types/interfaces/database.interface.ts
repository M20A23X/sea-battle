import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

type DatasourceConfigDefault = Required<
    Pick<
        MysqlConnectionOptions,
        'type' | 'host' | 'port' | 'database' | 'synchronize'
    >
>;

interface IDatabaseConfig {
    datasource: MysqlConnectionOptions;
    limitFallback: number;
    passwordSalt: string;
}

interface IDatabaseConfigDefault
    extends Pick<IDatabaseConfig, 'limitFallback'> {
    datasource: DatasourceConfigDefault;
}

export { IDatabaseConfig, IDatabaseConfigDefault };
