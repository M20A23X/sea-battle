import { Module } from '@nestjs/common';
import { DataSourceProvider } from '#/configs';

@Module({
    providers: [DataSourceProvider],
    exports: [DataSourceProvider]
})
export class DataSourceModule {}
