import { Module } from '@nestjs/common';
import { ResourceController } from 'server/src/controllers/resource.controller';
import { ResourceService } from '#/services';

@Module({
    imports: [],
    controllers: [ResourceController],
    providers: [ResourceService]
})
export class ResourceModule {}
