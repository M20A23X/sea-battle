import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { INestApplication, LogLevel, ModuleMetadata } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { DataSource } from 'typeorm';
import bodyParser from 'body-parser';

import {
    IConfigSpecs,
    ISpecsConfig,
    IHealthConfig,
    IValidationConfig,
    NodeEnv
} from '#shared/types/interfaces';

import { SpecsConfig } from '../configs';
import { waitDataSource } from './';

import { IConfig } from '#/types';
import {
    AuthConfig,
    DatabaseConfig,
    EmailConfig,
    GeneralConfig,
    HealthConfig,
    PublicConfig,
    ValidationConfig
} from '#/configs';

import { AuthGuard } from '#/guards';
import { ExceptionFilter } from '#/filters';
import { ValidationPipe } from '#/pipes';

import {
    AuthModule,
    HealthModule,
    MailerModule,
    // ResourceModule,
    UserModule
} from '#/modules';
import { LoggerService } from '#/services';

type Init = [INestApplication, ISpecsConfig, LoggerService, DataSource];

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
                    GeneralConfig,
                    HealthConfig,
                    PublicConfig,
                    ValidationConfig
                ],
                envFilePath:
                    GeneralConfig().env.state === NodeEnv.Testing
                        ? '.env.test'
                        : GeneralConfig().env.state === NodeEnv.Development
                        ? '.env.dev'
                        : '.env'
            }),
            HealthModule,
            MailerModule,
            // ResourceModule,
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
        configService.getOrThrow('validation');
    const health: IHealthConfig = configService.getOrThrow('health');

    //--- Pipes -----------
    app.useGlobalPipes(new ValidationPipe(validation.validation));

    //--- Misc -----------
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //--- Logger -----------
    const logger: LoggerService = new LoggerService('SPECS');
    const logLevels: LogLevel[] = ['log', 'error', 'warn', 'verbose'];
    logger.setLogLevels(logLevels);
    app.useLogger(logger);

    // --- Datasource --------------------
    const dataSource: DataSource = app.get<DataSource>(DataSource);
    await waitDataSource(dataSource, health.databaseConnectionCheckTimeoutMs);

    await app.init();

    return [app, specs, logger, dataSource];
};
