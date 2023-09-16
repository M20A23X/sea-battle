import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LogHttpRequestMiddleware } from '#/middleware';

import { AuthModule, HealthModule, UsersModule } from '#/modules';

import { LoggerService } from '#/services';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
        HealthModule,
        UsersModule,
        AuthModule
    ],
    providers: [LoggerService]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogHttpRequestMiddleware).forRoutes('*');
    }
}
