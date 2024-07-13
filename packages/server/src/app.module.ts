import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';

import {
    AuthConfig,
    EnvConfig,
    HealthConfig,
    ValidationConfig,
    DatabaseConfig,
    EmailConfig,
    AssetsConfig
} from '#/configs';
import { AuthGuard } from '#/guards';
import { ExceptionLoggerFilter } from '#/filters';
import { LogRequestMiddleware } from '#/middleware';

import { AuthModule, HealthModule, UserModule, MailerModule } from '#/modules';
import { LoggerService } from '#/services';

@Module({
    imports: [
        CacheModule.register({ isGlobal: true }),
        JwtModule.register({ global: true }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
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
        { provide: APP_FILTER, useClass: ExceptionLoggerFilter }
    ]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogRequestMiddleware).forRoutes('*');
    }
}
