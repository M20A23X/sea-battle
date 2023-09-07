import { Module } from '@nestjs/common';

import { DataSourceModule } from 'modules/dataSource.module';

import { UsersRepository } from 'repositories/users.repository';
import { UsersService } from 'services/users.service';
import { UsersController } from 'controllers/users.controller';

@Module({
    imports: [DataSourceModule],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService],
})
export class UsersModule {}
