import { Module } from '@nestjs/common';
import { DataSourceProvider } from 'configs/dataSource.config';

@Module({
    providers: [DataSourceProvider],
    exports: [DataSourceProvider],
})
export class DataSourceModule {}
