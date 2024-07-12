import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { IUser } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- ImgPathDTO -----------
class ImgPathDTO implements Pick<IUser, 'imgPath'> {
    @ApiPropertyOptional()
    @IsString()
    @Matches(Format.path.regex, {
        message: 'image path ' + Format.path.errorMessage
    })
    public imgPath: string | null;
}

export { ImgPathDTO };
