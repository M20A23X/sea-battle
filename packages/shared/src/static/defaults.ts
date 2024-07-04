import { HttpStatus } from '@nestjs/common';
import {
    IAuthConfig,
    IEnvConfig,
    IFileConfig,
    IHealthConfig,
    IValidationConfig,
    NodeEnv
} from '#/types';
import { Exception } from '#/exceptions';

type DefaultConfig = IAuthConfig &
    IHealthConfig &
    IEnvConfig &
    IFileConfig &
    IValidationConfig;

const AllowedChars = 'a-zA-Z_0-9.';
const AllowedPathChars = `:\\/\\\\\\-${AllowedChars}`;

const Default: DefaultConfig = {
    auth: {
        jwtSecret: '',
        jwtExpireTimeS: 3600,
        refreshTokenExpireTimeS: 7776000,
        jwtAlgorithm: 'HS256'
    },
    env: {
        port: 0,
        state: NodeEnv.Development
    },
    file: {
        name: {
            allowedChars: AllowedChars,
            regex: new RegExp(`^[${AllowedChars}]+$`),
            maxlength: 400
        },
        path: {
            allowedChars: AllowedPathChars,
            regex: new RegExp(`^[${AllowedPathChars}]+$`)
        }
    },
    health: {
        databaseCheckTimeout: 300,
        diskThreshold: 0.85,
        memHeapThreshold: 1024 ** 3,
        memRSSThreshold: 1024 ** 3
    },
    validation: {
        config: {
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            disableErrorMessages: false
        },
        parseFilePipe: {
            fileIsRequired: true,
            errorHttpStatusCode: HttpStatus.BAD_REQUEST,
            exceptionFactory: () => new Exception('NOT_PROVIDED')
        }
    }
};

export { Default };
