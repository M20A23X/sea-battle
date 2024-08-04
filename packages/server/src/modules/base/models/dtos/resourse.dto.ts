import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

import { IResource } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- ResourceDTO -----------
class ResourceDTO implements IResource {
    @ApiProperty()
    @Matches(Format.path.regex, { message: 'path' + Format.path.errorMessage })
    path: string;
}

export { ResourceDTO };
