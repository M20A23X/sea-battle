import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Put,
    Query,
    Res,
} from '@nestjs/common';

import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
    ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';

import { ControllerRes, ServiceRes } from 'shared/types/requestResponse';
import { IUserPublicData } from 'shared/types/user';
import { TUserReadDbQualifier } from 'repositories/users.repository';

import { requireSendControllerRes } from 'utils/res.util';

import { User } from 'modules/user/models/entities/user.entity';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';
import { UsersReadDTO } from 'modules/user/models/dtos/usersRead.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';

import { UsersService } from 'services/users.service';

import { MIME_TYPE } from 'static/web';

export interface IUsersController {
    postCreateUser(body: UserCreateDTO, res: Response): ControllerRes;

    getReadUsers(
        query: UsersReadDTO,
        res: Response,
    ): ControllerRes<IUserPublicData[]>;

    putUpdateUser(
        body: UserUpdateDTO,
        res: Response,
    ): ControllerRes<IUserPublicData>;

    deleteUser(query: UserDeleteDTO, res: Response): ControllerRes;
}

@Controller('users')
export class UsersController implements IUsersController {
    constructor(private readonly _usersService: UsersService) {}

    ///--- Private ---///
    private readonly _sendRes = requireSendControllerRes(User.name);

    ///--- Public ---///
    @Post('/create')
    @ApiBody({ type: [UserCreateDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Create new user' })
    async postCreateUser(
        @Body() body: UserCreateDTO,
        @Res() res: Response,
    ): ControllerRes {
        const serviceRes: ServiceRes = await this._usersService.createUser(
            body.user,
        );
        return this._sendRes(serviceRes, res);
    }

    @Get('/read')
    @ApiQuery({ type: [UsersReadDTO] })
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Read users' })
    async getReadUsers(
        @Query() query: UsersReadDTO,
        @Res() res: Response,
    ): ControllerRes<IUserPublicData[]> {
        const readQualifier: TUserReadDbQualifier = query?.username
            ? query.username
            : query?.userUUID
            ? query.userUUID
            : {
                  startId: query?.startId,
                  endId: query?.endId,
              };
        const serviceRes: ServiceRes<IUserPublicData[]> =
            await this._usersService.readUsers(readQualifier, false);
        return this._sendRes(serviceRes, res);
    }

    @Put('/update')
    @ApiBody({ type: [UserUpdateDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Update user' })
    async putUpdateUser(
        @Body() body: UserUpdateDTO,
        @Res() res: Response,
    ): ControllerRes<IUserPublicData> {
        const serviceRes: ServiceRes<IUserPublicData> =
            await this._usersService.updateUser(body.user);
        return this._sendRes(serviceRes, res);
    }

    @Delete('/delete')
    @ApiQuery({ type: [UserDeleteDTO] })
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Delete user' })
    async deleteUser(
        @Query() query: UserDeleteDTO,
        @Res() res: Response,
    ): ControllerRes {
        const serviceRes: ServiceRes = await this._usersService.deleteUser(
            query.userUUID,
            query.currentPassword,
        );
        return this._sendRes(serviceRes, res);
    }
}
