import { NodeEnv } from '#shared/types/interfaces';
import { HttpStatus } from '@nestjs/common';
import { IDefault } from '#/types';

const Config: IDefault = {
    email: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: false
    },
    public: {
        public: { dir: 'public' },
        templates: { dir: 'templates' },
        assets: {
            dir: 'assets',
            allowedExtensions: ['png'],
            fileMaxSizeB: 5 * 1024 ** 2
        }
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
    },
    jwt: {
        tokens: {
            access: { timeMs: 600_000 },
            confirmation: { timeMs: 3_600_000 },
            resetPassword: { timeMs: 1_800_000 },
            refresh: { timeMs: 7_776_000_000 }
        },
        keyPath: {
            private: 'keys/jwtRS256.key',
            public: 'keys/jwtRS256.key.pub'
        }
    },
    health: {
        databaseCheckTimeout: 300,
        diskThreshold: 0.85,
        memHeapThreshold: 1024 ** 3,
        memRSSThreshold: 1024 ** 3
    },
    validation: {
        validation: {
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            disableErrorMessages: false
        },
        parseFilePipe: {
            fileIsRequired: true,
            errorHttpStatusCode: HttpStatus.BAD_REQUEST
        }
    }
};

export { Config };
