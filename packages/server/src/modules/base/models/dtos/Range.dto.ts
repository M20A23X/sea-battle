import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

import { IRange } from '#shared/types/interfaces';

//--- RangeDTO -----------
class RangeDTO implements IRange {
    @ApiProperty()
    @IsInt()
    @IsPositive()
    public start: number;

    @ApiProperty()
    @IsInt()
    @IsPositive()
    public end: number;
}

export { RangeDTO };
