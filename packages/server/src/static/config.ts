import { NodeEnv } from '#shared/types/interfaces';
import { ConfigBasic } from '#shared/static';
import { IConfigDefault } from '#/types/config';

const Config: IConfigDefault = {
    ...ConfigBasic,
    email: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: true
    },
    database: {
        datasource: {
            type: 'mysql',
            host: '127.0.0.1',
            port: 3306,
            database: 'games',
            synchronize: false
        },
        limitFallback: 10
    },
    env: {
        port: 5000,
        portWs: 5002,
        state: NodeEnv.Development,
        frontEndDomain: 'http://localhost:3000'
    }
};

export { Config };
