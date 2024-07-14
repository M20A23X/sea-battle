import bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import {
    IEnvConfig,
    IValidationConfig,
    NodeEnv
} from '#shared/types/interfaces';

import { IConfig } from '#/types';
import { AppModule } from '#/app.module';
import { LoggerService } from '#/services';

async function bootstrap() {
    //--- App -----------
    const app: INestApplication = await NestFactory.create(AppModule, {
        bodyParser: false
    });

    //--- Configs -----------
    const configService: ConfigService<IConfig> = app.get(ConfigService);
    const env: IEnvConfig = configService.getOrThrow('env');
    const validation: IValidationConfig =
        configService.getOrThrow('dtoValidation');

    //--- Pipes -----------
    app.useGlobalPipes(new ValidationPipe(validation.validation));

    //--- Logger -----------
    const logger: LoggerService = app.get(LoggerService);
    const logLevels: LogLevel[] =
        env.state === NodeEnv.Production
            ? ['log', 'error', 'warn']
            : ['log', 'error', 'warn', 'debug', 'verbose'];
    logger.setLogLevels(logLevels);
    app.useLogger(logger);

    //--- Misc -----------
    app.enableCors({ origin: '*' });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    //--- Swagger -----------
    const config = new DocumentBuilder()
        .setTitle('Games')
        .setVersion('1.0')
        .addTag('Games')
        .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    //--- App -----------
    await app.listen(env.port);
    logger.log(`Application is running on port: ${env.port}`);
}

bootstrap();
