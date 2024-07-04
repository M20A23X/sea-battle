import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';

import {
    AssetsConfig,
    AuthConfig,
    EnvConfig,
    HealthConfig,
    ValidationConfig
} from '#/configs';

import { AuthGuard } from '#/guards';
import { ExceptionLoggerFilter } from '#/filters';
import { LogRequestMiddleware } from '#/middleware';

import { HealthModule, ResourceModule } from '#/modules';
import { LoggerService } from '#/services';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [
                AssetsConfig,
                AuthConfig,
                EnvConfig,
                HealthConfig,
                ValidationConfig
            ]
        }),
        ServeStaticModule.forRoot({
            rootPath: AssetsConfig().assets.root,
            serveRoot: AssetsConfig().assets.root,
            serveStaticOptions: { index: false }
        }),
        JwtModule.register({
            global: true,
            secret: AuthConfig().auth.jwtSecret,
            signOptions: {
                expiresIn: AuthConfig().auth.jwtExpireTimeS
            }
        }),
        HealthModule,
        ResourceModule
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
