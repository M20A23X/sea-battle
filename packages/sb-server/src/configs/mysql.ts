import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'bjfbqkegepz9ejwtnsm8-mysql.services.clever-cloud.com',
            port: 3306,
            username: 'uhth5r39yzkoy4wm',
            password: 'NXO1Alycii6PYzsKcDy7',
            database: 'bjfbqkegepz9ejwtnsm8',
            entities: [],
            synchronize: true,
        }),
    ],
})
export class DatabaseModule {}
