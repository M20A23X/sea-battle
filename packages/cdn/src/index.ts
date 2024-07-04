import { NestFactory } from '@nestjs/core';
import { INestApplication, LogLevel, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import {
    IAuthConfig,
    IEnvConfig,
    IValidationConfig,
    NodeEnv
} from '#shared/types';
import { EnvException } from '#shared/exceptions';

import { AppModule } from '#/app.module';
import { ILoggerService, LoggerService } from '#/services';

async function bootstrap() {
    const app: INestApplication = await NestFactory.create(AppModule, {
        bodyParser: false
    });

    // Configs
    const configService: ConfigService<
        IValidationConfig & IEnvConfig & IAuthConfig
    > = app.get(ConfigService);
    const env: IEnvConfig['env'] = configService.getOrThrow('env');
    const validation: IValidationConfig['validation'] =
        configService.getOrThrow('validation');

    // Auth
    const auth: IAuthConfig['auth'] = configService.getOrThrow('auth');
    if (!auth.jwtSecret) throw new EnvException(`JWT Secret isn't set`);

    // Pipes
    app.useGlobalPipes(new ValidationPipe(validation.config));

    // Logger
    const loggerService: ILoggerService = app.get(LoggerService);
    const logLevels: LogLevel[] =
        env.state === NodeEnv.Production
            ? ['log', 'error', 'warn']
            : ['log', 'error', 'warn', 'debug', 'verbose'];
    loggerService.setLogLevels(logLevels);
    app.useLogger(loggerService);

    // Cors
    app.enableCors({ origin: '*' });

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('Games')
        .setVersion('1.0')
        .addTag('Games')
        .build();
    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(env.port);
    loggerService.log(`Application is running on port: ${env.port}`);
}

bootstrap();
