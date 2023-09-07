import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Put,
    Query,
} from '@nestjs/common';

import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
} from '@nestjs/swagger';

import { TPromiseResponse, TResponse } from 'shared/types/requestResponse';
import { IUserPublicData } from 'shared/types/user';
import { TUserReadDbQualifier } from 'repositories/users.repository';

import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';
import { UsersReadDTO } from 'modules/user/models/dtos/usersRead.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';

import { UsersService } from 'services/users.service';

import { FALLBACK } from 'static/database';

export interface IUsersController {
    postCreateUser(body: UserCreateDTO): Promise<TResponse>;

    getReadUsers(query: UsersReadDTO): TPromiseResponse<IUserPublicData[]>;

    putUpdateUser(body: UserUpdateDTO): TPromiseResponse<IUserPublicData>;

    deleteUser(query: UserDeleteDTO): TPromiseResponse;
}

@Controller('users')
export class UsersController implements IUsersController {
    constructor(private readonly _usersService: UsersService) {}

    @Post('/create')
    @ApiBody({ type: [UserCreateDTO] })
    @ApiConsumes('application/json')
    @ApiProduces('application/json')
    @ApiOperation({ summary: 'Create new user' })
    async postCreateUser(@Body() body: UserCreateDTO): TPromiseResponse {
        return this._usersService.createUser(body.user);
    }

    @Get('/read')
    async getReadUsers(
        @Query() query: UsersReadDTO,
    ): TPromiseResponse<IUserPublicData[]> {
        const readQualifier: TUserReadDbQualifier = query?.username
            ? query.username
            : query?.userUUID
            ? query.userUUID
            : {
                  startId: query?.startId || 0,
                  endId: query?.endId || FALLBACK.maxReadAmount,
              };
        return this._usersService.readUsers(readQualifier);
    }

    @Put('/update')
    async putUpdateUser(
        @Body() body: UserUpdateDTO,
    ): TPromiseResponse<IUserPublicData> {
        return this._usersService.updateUser(body.user);
    }

    @Delete('/delete')
    async deleteUser(@Query() query: UserDeleteDTO): TPromiseResponse {
        return this._usersService.deleteUser(
            query.userUUID,
            query.currentPassword,
        );
    }
}
