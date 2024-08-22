import { Module } from '@nestjs/common';
import { ResourceController } from '#/controllers/resource.controller';
import { ResourceService } from '#/services';

@Module({
    imports: [],
    controllers: [ResourceController],
    providers: [ResourceService]
})
export class ResourceModule {}
