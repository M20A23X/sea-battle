import { Module } from '@nestjs/common';

import { DataSourceModule } from '#/modules';

import { UserService } from '#/services';
import { UserController } from '#/controllers';
import { UserRepository } from '#/repositories';

@Module({
    imports: [DataSourceModule],
    controllers: [UserController],
    providers: [UserRepository, UserService],
    exports: [UserService]
})
export class UserModule {}
