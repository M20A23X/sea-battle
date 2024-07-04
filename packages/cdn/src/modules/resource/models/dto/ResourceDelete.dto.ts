import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { Resource, ResourceReqDTO } from '#shared/types';

import { ResourceDTO } from '#/modules/resource';

export class ResourceData
    extends PickType(ResourceDTO, ['path'])
    implements Resource {}

export class ResourceDeleteDTO implements ResourceReqDTO<Resource> {
    @ApiProperty({ type: () => ResourceData })
    @IsObject()
    @ValidateNested()
    @Type(() => ResourceData)
    resource: Resource;
}
