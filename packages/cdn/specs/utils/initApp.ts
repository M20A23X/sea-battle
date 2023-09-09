import * as process from 'process';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';

import { JWT_EXPIRE_TIME_S } from 'shared/static/common';

import { AuthGuard } from 'guards/auth.guard';

export const initApp = async (): Promise<[INestApplication, TestingModule]> => {
    const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            JwtModule.register({
                global: true,
                secret: process.env.JWT_SECRET,
                signOptions: {
                    expiresIn: process.env.JWT_EXPIRE_TIME || JWT_EXPIRE_TIME_S,
                },
            }),
        ],
        providers: [AuthGuard],
    }).compile();

    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();

    return [app, moduleRef];
};
