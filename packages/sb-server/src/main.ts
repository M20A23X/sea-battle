import * as process from 'process';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'modules/app.module';
import { ILoggerService, LoggerService } from 'services/logger.service';

const PORT = parseInt(process.env.PORT || '') || 5000;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger:
            process.env.NODE_ENV === 'dev'
                ? ['log', 'error', 'warn', 'debug', 'verbose']
                : ['log', 'error', 'warn'],
    });

    const loggerService: ILoggerService = app.get(LoggerService);

    app.useLogger(loggerService);

    await app.listen(PORT);
    loggerService.log(`Application running on port: ${PORT}`);
}

bootstrap();
