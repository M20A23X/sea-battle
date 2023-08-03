import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { MYSQL_CONFIG } from 'configs/mysql.config';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(MYSQL_CONFIG),
    ],
    exports: [ConfigModule],
})
export class AppModule {}
