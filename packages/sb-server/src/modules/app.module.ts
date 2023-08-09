import process from 'process';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LogHttpRequestMiddleware } from 'middleware/logHttpRequest.middleware';
import { LoggerService } from 'services/logger.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV}`,
        }),
    ],
    providers: [LoggerService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogHttpRequestMiddleware).forRoutes('*');
    }
}
