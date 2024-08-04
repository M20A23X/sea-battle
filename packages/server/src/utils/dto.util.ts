import { ApiProperty } from '@nestjs/swagger';
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { IAuthDTO, IResourceDTO, IUserDTO } from '#shared/types/interfaces';

const DTO = {
    user: <T extends object>(type: { new (): T }) => {
        class ModuleDTO implements IUserDTO<T> {
            @ApiProperty({ type })
            @IsObject()
            @ValidateNested()
            @Type(() => type)
            public user: T;
        }

        return ModuleDTO;
    },
    auth: <T extends object>(type: { new (): T }) => {
        class ModuleDTO implements IAuthDTO<T> {
            @ApiProperty({ type })
            @IsObject()
            @ValidateNested()
            @Type(() => type)
            public auth: T;
        }

        return ModuleDTO;
    },
    resource: <T extends object>(type: { new (): T }) => {
        class ModuleDTO implements IResourceDTO<T> {
            @ApiProperty({ type })
            @IsObject()
            @ValidateNested()
            @Type(() => type)
            public resource: T;
        }

        return ModuleDTO;
    }
};

export { DTO };
