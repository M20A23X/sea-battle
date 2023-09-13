import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Put,
    Query
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
    ApiQuery
} from '@nestjs/swagger';

import { PromiseRes } from 'shared/types/requestResponse';
import { UserPublicData } from 'shared/types/user';

import { MIME_TYPE } from 'shared/static/web';

import { TUserReadDbQualifier } from 'repositories/user.repository';

import { UserService } from 'services/user.service';

import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';
import { UsersReadDTO } from 'modules/user/models/dtos/usersRead.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';

export interface IUserController {
    postCreateUser(body: UserCreateDTO): PromiseRes;

    getReadUsers(query: UsersReadDTO): PromiseRes<UserPublicData[]>;

    putUpdateUser(body: UserUpdateDTO): PromiseRes<UserPublicData>;

    deleteUser(body: UserDeleteDTO): PromiseRes;
}

@Controller('users')
export class UserController implements IUserController {
    constructor(private readonly _usersService: UserService) {}

    ///--- Public ---///
    @Post('/create')
    @ApiBody({ type: [UserCreateDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Create new user' })
    async postCreateUser(@Body() body: UserCreateDTO): PromiseRes {
        return await this._usersService.createUser(body.user);
    }

    @Get('/read')
    @ApiQuery({ type: [UsersReadDTO] })
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Read users' })
    async getReadUsers(
        @Query() query: UsersReadDTO
    ): PromiseRes<UserPublicData[]> {
        const readQualifier: TUserReadDbQualifier = query?.username
            ? query.username
            : query?.userUUID
            ? query.userUUID
            : { startId: query?.startId, endId: query?.endId };
        return await this._usersService.readUsers(readQualifier, false);
    }

    @Put('/update')
    @ApiBody({ type: [UserUpdateDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Update user' })
    async putUpdateUser(
        @Body() body: UserUpdateDTO
    ): PromiseRes<UserPublicData> {
        return await this._usersService.updateUser(body.user);
    }

    @Delete('/delete')
    @ApiQuery({ type: [UserDeleteDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Delete user' })
    async deleteUser(@Body() body: UserDeleteDTO): PromiseRes {
        const { userUUID, currentPassword } = body.user;
        return await this._usersService.deleteUser(userUUID, currentPassword);
    }
}
