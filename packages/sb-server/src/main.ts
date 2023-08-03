import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { VALIDATION_CONFIG } from 'configs/validation.config';

const PORT = 5000;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe(VALIDATION_CONFIG));
    await app.listen(PORT);
}

bootstrap();
