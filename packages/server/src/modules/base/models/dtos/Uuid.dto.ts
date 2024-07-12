import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IUuid } from '#shared/types/interfaces';

//--- UuidDTO -----------
class UuidDTO implements IUuid {
    @ApiProperty()
    @IsUUID()
    public uuid: string;
}

export { UuidDTO };
