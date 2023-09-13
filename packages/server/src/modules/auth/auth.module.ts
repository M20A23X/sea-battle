import process from 'process';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JWT_EXPIRE_TIME_S } from 'shared/static/common';
import { AuthGuard } from 'guards/auth.guard';
import { DataSourceModule } from 'modules/dataSource.module';
import { UsersModule } from 'modules/user/users.module';

import { RefreshTokenRepository } from 'repositories/refreshToken.repository';
import { AuthController } from 'controllers/auth.controller';
import { AuthService } from 'services/auth.service';

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
