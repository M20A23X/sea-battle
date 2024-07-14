import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

import { IIdRange } from '#shared/types/interfaces';
import { IsBiggerThan } from '#/decorators';

//--- RangeDTO -----------
class RangeDTO implements IIdRange {
    @ApiProperty()
    @IsInt()
    @IsPositive()
    public startId: number;

    @ApiPropertyOptional()
    @IsInt()
    @IsPositive()
    @IsBiggerThan('start' as keyof IIdRange, {
        message: 'end must be grater than start'
    })
    public endId?: number;
}

export { RangeDTO };
