import process from 'process';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import { JWT_EXPIRE_TIME_S } from 'shared/static/common';

import { validationConfig } from 'configs/validation.config';

import { ExceptionLoggerFilter } from 'filters/exceptionLogger.filter';

import { RefreshTokenRepository } from 'repositories/refreshToken.repository';

import { LoggerService } from 'services/logger.service';

import { AuthModule } from 'modules/auth/auth.module';
import { DataSourceModule } from 'modules/dataSource.module';
import { UsersModule } from 'modules/user/users.module';

export const initApp = async (): Promise<[TestingModule, INestApplication]> => {
    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET,
                signOptions: {
                    expiresIn: process.env.JWT_EXPIRE_TIME || JWT_EXPIRE_TIME_S
                }
            }),
            AuthModule,
            UsersModule,
            DataSourceModule
        ],
        providers: [LoggerService, RefreshTokenRepository]
    }).compile();

    const app: INestApplication = moduleRef.createNestApplication();
    app.useGlobalFilters(new ExceptionLoggerFilter());
    app.useGlobalPipes(new ValidationPipe(validationConfig));
    app.useLogger(app.get(LoggerService));

    await app.init();

    return [moduleRef, app];
};
