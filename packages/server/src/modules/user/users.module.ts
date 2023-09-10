import { Module } from '@nestjs/common';

import { UserRepository } from '../../repositories/user.repository';
import { UserService } from '../../services/user.service';
import { UserController } from '../../controllers/user.controller';
import { DataSourceModule } from 'modules/dataSource.module';

@Module({
    imports: [DataSourceModule],
    controllers: [UserController],
    providers: [UserService, UserRepository],
    exports: [UserService],
})
export class UsersModule {}
