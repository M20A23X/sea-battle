import * as process from 'process';
import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from 'modules/app.module';
import { ILoggerService, LoggerService } from 'services/logger.service';

import { VALIDATION_CONFIG } from 'configs/validation.config';

const PORT = parseInt(process.env.PORT || '') || 5000;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger:
            process.env.NODE_ENV === 'dev'
                ? ['log', 'error', 'warn', 'debug', 'verbose']
                : ['log', 'error', 'warn'],
    });

    const loggerService: ILoggerService = app.get(LoggerService);

    app.useGlobalPipes(new ValidationPipe(VALIDATION_CONFIG));
    app.useLogger(loggerService);

    const config = new DocumentBuilder()
        .setTitle('Games')
        .setVersion('1.0')
        .addTag('Games')
        .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(PORT);
    loggerService.log(`Application running on port: ${PORT}`);
}

bootstrap();
