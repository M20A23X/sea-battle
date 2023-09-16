import { Module } from '@nestjs/common';

import { DataSourceModule } from '#/modules';

import { UserRepository } from '#/repositories';
import { UserService } from '#/services';
import { UserController } from '#/controllers';

@Module({
    imports: [DataSourceModule],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [UserService]
})
export class UsersModule {}
