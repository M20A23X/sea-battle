import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { NodeEnv } from '#shared/types/interfaces';
import {
    AssetsConfig,
    AuthConfig,
    DatabaseConfig,
    EmailConfig,
    EnvConfig,
    HealthConfig,
    ValidationConfig
} from '#/configs';
import { AuthGuard } from '#/guards';
import { ExceptionFilter } from '#/filters';
import { LogRequestMiddleware } from '#/middleware';

import { AuthModule, HealthModule, MailerModule, UserModule } from '#/modules';
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
            ],
            envFilePath:
                EnvConfig().env.state === NodeEnv.Testing ? '.env.test' : '.env'
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
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogRequestMiddleware).forRoutes('*');
    }
}
