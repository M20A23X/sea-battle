import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { IImgPath } from '#shared/types/interfaces';
import { Format } from '#shared/static';

//--- ImgPathDTO -----------
class ImgPathDTO implements IImgPath {
    @ApiPropertyOptional()
    @IsString()
    @MinLength(Format.path.minLength)
    @MaxLength(Format.path.maxLength)
    @Matches(Format.path.regex, {
        message: 'image path' + Format.path.errorMessage
    })
    public imgPath: string | null;
}

export { ImgPathDTO };
