import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';

import { LogHttpRequestMiddleware } from 'middleware/logHttpRequest.middleware';

import { LoggerService } from 'services/logger.service';

import { HealthModule } from 'modules/health.module';

import { ASSETS_ROOT } from 'static/common';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ServeStaticModule.forRoot({ rootPath: ASSETS_ROOT }),
        HealthModule,
    ],
    providers: [LoggerService],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LogHttpRequestMiddleware).forRoutes('*');
    }
}
