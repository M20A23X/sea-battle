import { IToken } from '#shared/types/interfaces';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

//--- TokenDTO -----------
class TokenDTO implements IToken {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'token must not be empty' })
    public token: string;
}

export { TokenDTO };
