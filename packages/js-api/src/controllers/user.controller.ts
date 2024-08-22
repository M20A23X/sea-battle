import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Put,
    UseGuards
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces
} from '@nestjs/swagger';

import {
    IEmail,
    IIdRange,
    IUsername,
    IUserPublic,
    IUuid,
    MimeType,
    Res
} from '#shared/types/interfaces';
import { Route } from '#shared/static';

import {
    UserDeleteDTO,
    UserReadDTOType,
    UserReadSchema,
    UserUpdateDTO
} from '#/modules/user';
import { ReadParamEnum, UserService } from '#/services';
import { AuthGuard } from '#/guards';

interface IUserController {
    getRead(body: UserReadDTOType): Res<IUserPublic[]>;
    putUpdate(body: UserUpdateDTO): Res<IUserPublic>;
    delete(body: UserDeleteDTO): Res;
}

@Controller(Route.users.index)
@UseGuards(AuthGuard)
class UserController implements IUserController {
    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(UserService)
        private readonly _usersService: UserService
    ) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------

    //--- GET /read -----------
    @Get()
    @ApiBody(UserReadSchema)
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({
        summary: 'Read user(s) by username, uuid, email or id range'
    })
    async getRead(@Body() body: UserReadDTOType): Res<IUserPublic[]> {
        let payload: IUserPublic[];

        if (body.user?.hasOwnProperty('username' as keyof IUsername)) {
            payload = await this._usersService.read(
                ReadParamEnum.Username,
                body.user as IUsername,
                false
            );
        } else if (body.user?.hasOwnProperty('uuid' as keyof IUuid)) {
            payload = await this._usersService.read(
                ReadParamEnum.Uuid,
                body.user as IUuid,
                false
            );
        } else if (body.user?.hasOwnProperty('email' as keyof IEmail)) {
            payload = await this._usersService.read(
                ReadParamEnum.Email,
                body.user as IEmail,
                false
            );
        } else if (body.user?.hasOwnProperty('startId' as keyof IIdRange)) {
            payload = await this._usersService.read(
                ReadParamEnum.IdRange,
                body.user as IIdRange,
                false
            );
        } else throw new BadRequestException('incorrect request');

        return { message: 'Successfully read the users', payload };
    }

    //--- PUT /update -----------
    @Put()
    @ApiBody({ type: [UserUpdateDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Update the user' })
    async putUpdate(@Body() body: UserUpdateDTO): Res<IUserPublic> {
        const payload: IUserPublic = await this._usersService.update(body.user);
        return { message: 'Successfully updated the user', payload };
    }

    //--- DELETE /delete -----------
    @Delete()
    @ApiBody({ type: [UserDeleteDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Delete the user' })
    async delete(@Body() { user }: UserDeleteDTO): Res {
        await this._usersService.delete(user.uuid);
        return { message: 'Successfully deleted the user' };
    }
}

export { UserController };
