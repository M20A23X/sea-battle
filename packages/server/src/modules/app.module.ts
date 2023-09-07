import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './health.module';
import { UsersModule } from './user/users.module';
import { AuthModule } from './auth/auth.module';

import { LogHttpRequestMiddleware } from 'middleware/logHttpRequest.middleware';

import { LoggerService } from 'services/logger.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HealthModule,
        UsersModule,
        AuthModule,
    ],
    providers: [LoggerService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogHttpRequestMiddleware).forRoutes('*');
    }
}
