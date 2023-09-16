import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { NODE_ENV_PROD } from '#shared/static';
import { PORT } from '#/static';

import { validationConfig } from '#/configs';

import { ExceptionLoggerFilter } from '#/filters';

import { ILoggerService, LoggerService } from '#/services/logger.service';

import { AppModule } from '#/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger:
            process.env.NODE_ENV !== NODE_ENV_PROD
                ? ['log', 'error', 'warn', 'debug', 'verbose']
                : ['log', 'error', 'warn']
    });

    const loggerService: ILoggerService = app.get(LoggerService);

    app.useGlobalFilters(new ExceptionLoggerFilter());
    app.useGlobalPipes(new ValidationPipe(validationConfig));
    app.useLogger(loggerService);
    app.enableCors({ origin: '*' });

    const config = new DocumentBuilder()
        .setTitle('Games')
        .setVersion('1.0')
        .addTag('Games')
        .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = parseInt(process.env.SERVER_PORT_HTTP || '') || PORT;
    await app.listen(port);
    loggerService.log(`Application running on port: ${port}`);
}

bootstrap();
