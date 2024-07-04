import { Algorithm } from 'jsonwebtoken';
import { ValidationPipeOptions } from '@nestjs/common';
import { ParseFileOptions } from '@nestjs/common/pipes/file/parse-file-options.interface';

enum NodeEnv {
    Production = 'production',
    Development = 'development'
}

interface IAssetsConfig {
    assets: {
        dir: string;
        root: string;
        fileMaxSizeB: number;
        allowedExtensions: string[];
    };
}

interface IAuthConfig {
    auth: {
        jwtSecret: string;
        jwtExpireTimeS: number;
        jwtAlgorithm: Algorithm;
        refreshTokenExpireTimeS: number;
    };
}

interface IEnvConfig {
    env: {
        port: number;
        state: NodeEnv;
    };
}

type Property = 'name' | 'path';

interface IFileConfig {
    file: {
        [K in Property]: {
            allowedChars: string;
            regex: RegExp;
            maxlength?: number;
        };
    };
}

type IHealthConfig = {
    health: {
        databaseCheckTimeout: number;
        diskThreshold: number;
        memHeapThreshold: number;
        memRSSThreshold: number;
    };
};

interface IValidationConfig {
    validation: {
        config: ValidationPipeOptions;
        parseFilePipe: ParseFileOptions;
    };
}

export {
    IAssetsConfig,
    IAuthConfig,
    IEnvConfig,
    IFileConfig,
    IHealthConfig,
    IValidationConfig,
    NodeEnv
};
