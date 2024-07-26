import { ApiProperty } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IAuthDTO, IUserDTO } from '#shared/types/interfaces';

const createUserDTO = <T extends object>(type: { new (): T }) => {
    class ModuleDTO implements IUserDTO<T> {
        @ApiProperty({ type })
        @IsObject()
        @ValidateNested()
        @Type(() => type)
        public user: T;
    }

    return ModuleDTO;
};

const createAuthDTO = <T extends object>(type: { new (): T }) => {
    class ModuleDTO implements IAuthDTO<T> {
        @ApiProperty({ type })
        @IsObject()
        @ValidateNested()
        @Type(() => type)
        public auth: T;
    }

    return ModuleDTO;
};

export { createUserDTO, createAuthDTO };
