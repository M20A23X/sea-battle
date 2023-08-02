import { Module } from '@nestjs/common';
import { DatabaseModule } from 'configs/mysql';

@Module({
    imports: [DatabaseModule],
})
export class AppModule {}
