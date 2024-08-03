import { Module } from '@nestjs/common';
import { DataSourceProvider } from '#/providers';

@Module({
    providers: [DataSourceProvider],
    exports: [DataSourceProvider]
})
export class DataSourceModule {}
