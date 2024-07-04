import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { Resource } from '#shared/types';

import { Format } from '#/static';

export class ResourceDTO implements Resource {
    @ApiProperty()
    @Matches(Format.path.format, { message: Format.path.errorMessage })
    path: string;
}
