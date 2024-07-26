import { forwardRef, Module } from '@nestjs/common';

import { DataSourceModule, MailerModule, UserModule } from '#/modules';

import { AuthController } from '#/controllers';
import { AuthService } from '#/services';

@Module({
    imports: [DataSourceModule, MailerModule, forwardRef(() => UserModule)],
    controllers: [AuthController],
    providers: [AuthService]
})
export class AuthModule {}
