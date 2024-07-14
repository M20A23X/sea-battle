import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
    INestApplication,
    LogLevel,
    ModuleMetadata,
    ValidationPipe
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';

import { IConfigSpecs, ISpecsConfig } from '#shared/specs/types';
import { IValidationConfig } from '#shared/types/interfaces';

import bodyParser from 'body-parser';
import { SpecsConfig } from '../configs';

import { AuthGuard } from '#/guards';
import { ExceptionFilter } from '#/filters';

import { AuthModule, HealthModule, MailerModule, UserModule } from '#/modules';
import { LoggerService } from '#/services';

import {
    AssetsConfig,
    AuthConfig,
    DatabaseConfig,
    EmailConfig,
    EnvConfig,
    HealthConfig,
    ValidationConfig
} from '#/configs';
import { IConfig } from '#/types';

type Init = [INestApplication, ISpecsConfig, LoggerService];

export const init = async (): Promise<Init> => {
    const metadata: ModuleMetadata = {
        imports: [
            CacheModule.register({ isGlobal: true }),
            JwtModule.register({ global: true }),
            ConfigModule.forRoot({
                isGlobal: true,
                load: [
                    SpecsConfig,
                    AuthConfig,
                    DatabaseConfig,
                    EmailConfig,
                    EnvConfig,
                    HealthConfig,
                    AssetsConfig,
                    ValidationConfig
                ]
            }),
            HealthModule,
            MailerModule,
            UserModule,
            AuthModule
        ],
        providers: [
            AuthGuard,
            LoggerService,
            { provide: APP_FILTER, useClass: ExceptionFilter }
        ]
    };

    //--- App -----------
    const moduleFixture: TestingModule = await Test.createTestingModule(
        metadata
    ).compile();
    const app: INestApplication = await moduleFixture.createNestApplication();

    //--- Configs -----------
    const configService: ConfigService<IConfig & IConfigSpecs> =
        app.get(ConfigService);
    const specs = configService.getOrThrow('specs');
    const validation: IValidationConfig =
        configService.getOrThrow('dtoValidation');

    //--- Pipes -----------
    app.useGlobalPipes(new ValidationPipe(validation.validation));

    //--- Misc -----------
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //--- Logger -----------
    const logger: LoggerService = new LoggerService('SPECS');
    const logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
    logger.setLogLevels(logLevels);
    app.useLogger(logger);

    await app.init();

    return [app, specs, logger];
};
