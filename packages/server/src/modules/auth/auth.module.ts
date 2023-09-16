import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JWT_EXPIRE_TIME_S } from '#shared/static';

import { AuthGuard } from '#/guards';

import { DataSourceModule, UsersModule } from '#/modules';

import { RefreshTokenRepository } from '#/repositories';
import { AuthController } from '#/controllers';
import { AuthService } from '#/services';

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: process.env.JWT_EXPIRE_TIME || JWT_EXPIRE_TIME_S
            }
        }),
        UsersModule,
        DataSourceModule
    ],
    controllers: [AuthController],
    providers: [AuthGuard, AuthService, RefreshTokenRepository]
})
export class AuthModule {}
