import { NodeEnv } from '#shared/types/interfaces';
import { ConfigBasic } from '#shared/static';
import { IConfigDefault } from '#/types/config';

const Config: IConfigDefault = {
    ...ConfigBasic,
    email: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: false
    },
    database: {
        datasource: {
            type: 'mysql',
            host: '127.0.0.1',
            port: 3306,
            database: 'games',
            synchronize: true
        },
        limitFallback: 10
    },
    env: {
        port: 5000,
        portWs: 5002,
        appName: 'App',
        state: NodeEnv.Development,
        frontEndOrigin: 'http://localhost:3000'
    }
};

export { Config };
