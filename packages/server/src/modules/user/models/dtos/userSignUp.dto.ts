import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';

import { IAuthDTO, IUserCreate } from '#shared/types/interfaces';
import { PasswordSetDTO, UsernameDTO } from '#/modules/base';
import { ImgPathDTO } from '#/modules/base/models/dtos/ImgPath.dto';
import { EmailDTO } from '#/modules/base/models/dtos/Email.dto';

class Data
    extends IntersectionType(UsernameDTO, EmailDTO, PasswordSetDTO, ImgPathDTO)
    implements IUserCreate {}

class UserSignUpDTO implements IAuthDTO<IUserCreate> {
    @ApiProperty({ type: () => Data })
    @IsObject()
    @ValidateNested()
    @Type(() => Data)
    public auth: IUserCreate;
}

export { UserSignUpDTO };
