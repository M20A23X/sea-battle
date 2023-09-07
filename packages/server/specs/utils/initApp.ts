import process from 'process';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';

import { DataSourceModule } from 'modules/dataSource.module';

import { JWT_EXPIRE_TIME_S } from 'static/common';

import { UsersModule } from 'modules/user/users.module';
import { AuthController } from 'controllers/auth.controller';
import { AuthService } from 'services/auth.service';
import { AuthGuard } from 'guards/auth.guard';
import { RefreshTokenRepository } from 'repositories/refreshToken.repository';

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
            UsersModule,
            DataSourceModule,
        ],

        controllers: [AuthController],
        providers: [AuthService, AuthGuard, RefreshTokenRepository],
    }).compile();

    const app: INestApplication = moduleRef.createNestApplication();
    await app.init();

    return [app, moduleRef];
};
