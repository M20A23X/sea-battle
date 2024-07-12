import { Module } from '@nestjs/common';

import { AuthGuard } from '#/guards';

import { DataSourceModule, MailerModule, UserModule } from '#/modules';

import { AuthController } from '#/controllers';
import { AuthService } from '#/services';

@Module({
    imports: [DataSourceModule, MailerModule, UserModule],
    controllers: [AuthController],
    providers: [AuthGuard, AuthService],
    exports: [AuthService]
})
export class AuthModule {}
