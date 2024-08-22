import { NodeEnv } from '#shared/types/interfaces';
import { HttpStatus } from '@nestjs/common';
import { IDefault } from '#/types';

const Config: IDefault = {
    email: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 587,
        secure: true
    },
    public: {
        public: { dir: 'public' },
        templates: { dir: 'templates' },
        assets: {
            dir: 'assets',
            allowedExtensions: ['png'],
            fileMaxSizeB: 5 * 1024 ** 2
        },
        multer: {
            files: 1,
            fields: 1
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
        portWs: 5001,
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
        }
    },
    health: {
        databaseConnectionCheckTimeoutMs: 300,
        diskThresholdPercent: 0.85,
        memHeapThresholdB: 1024 ** 3,
        memRSSThresholdB: 1024 ** 3
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
