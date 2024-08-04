import { v4 } from 'uuid';
import * as Jwt from 'jsonwebtoken';
import { DataSource } from 'typeorm';
import bodyParser from 'body-parser';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { INestApplication, LogLevel, ModuleMetadata } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import {
    IConfigSpecs,
    ISpecsConfig,
    IHealthConfig,
    IValidationConfig,
    NodeEnv,
    TokenTypeEnum,
    IAccessPayload,
    IJwtConfig,
    IEnvConfig
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
    AssetsConfig,
    ValidationConfig
} from '#/configs';

import { AuthGuard } from '#/guards';
import { ExceptionFilter } from '#/filters';
import { ValidationPipe } from '#/pipes';

import {
    AuthModule,
    HealthModule,
    MailerModule,
    ResourceModule,
    UserModule
} from '#/modules';
import { LoggerService } from '#/services';
import { IEmailConfig } from '#/types/interfaces';

type Init = [INestApplication, ISpecsConfig, LoggerService, string, DataSource];

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
                    AssetsConfig,
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
            ResourceModule,
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
    const jwt: IJwtConfig = configService.getOrThrow('jwt');
    const email: IEmailConfig = configService.getOrThrow('email');
    const env: IEnvConfig = configService.getOrThrow('env');

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

    // --- JWT --------------------
    const jwtOptions: JwtSignOptions = {
        issuer: env.appId,
        audience: env.frontEndOrigin,
        subject: email.credentials.username,
        expiresIn: jwt.tokens[TokenTypeEnum.ACCESS].timeMs,
        algorithm: 'RS256'
    };
    const jwtPayload: IAccessPayload = { uuid: v4(), username: 'username' };
    const token: string = Jwt.sign(
        jwtPayload,
        jwt.tokens[TokenTypeEnum.ACCESS].privateKey,
        jwtOptions
    );
    const accessToken = `Bearer ${token}`;
    logger.debug(token);

    await app.init();

    return [app, specs, logger, accessToken, dataSource];
};
