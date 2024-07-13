import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Put
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
    getSchemaPath
} from '@nestjs/swagger';

import {
    IEmail,
    IRange,
    IUsername,
    IUserPublic,
    IUuid,
    MimeType,
    Res
} from '#shared/types/interfaces';
import { UserDeleteDTO, UserUpdateDTO } from '#/modules/user';
import { UserService } from '#/services';
import { EmailDTO, RangeDTO, UsernameDTO, UuidDTO } from '#/modules/base';

interface IUserController {
    getRead(
        query: UsernameDTO | UuidDTO | EmailDTO | RangeDTO
    ): Res<IUserPublic[]>;

    putUpdate(body: UserUpdateDTO): Res<IUserPublic>;

    delete(body: UserDeleteDTO): Res;
}

@Controller('/users')
class UserController implements IUserController {
    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(UserService)
        private readonly _usersService: UserService
    ) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------

    //--- GET /read -----------
    @Get('/read')
    @ApiBody({
        schema: {
            oneOf: [
                { $ref: getSchemaPath(UuidDTO) },
                { $ref: getSchemaPath(UsernameDTO) },
                { $ref: getSchemaPath(EmailDTO) },
                { $ref: getSchemaPath(RangeDTO) }
            ]
        }
    })
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Read user(s) by username, uuid or email' })
    async getRead(
        @Body()
        body: UsernameDTO | UuidDTO | EmailDTO | RangeDTO
    ): Res<IUserPublic[]> {
        let payload: IUserPublic[];
        switch (body.constructor) {
            case UsernameDTO:
                payload = await this._usersService.read(
                    'username',
                    body as IUsername,
                    false
                );
                break;
            case UuidDTO:
                payload = await this._usersService.read(
                    'uuid',
                    body as IUuid,
                    false
                );
                break;
            case EmailDTO:
                payload = await this._usersService.read(
                    'email',
                    body as IEmail,
                    false
                );
                break;
            case RangeDTO:
                payload = await this._usersService.read(
                    'range',
                    body as IRange,
                    false
                );
                break;
            default:
                throw new BadRequestException('incorrect request');
        }
        return { message: 'Successfully read the users', payload };
    }

    //--- PUT /update -----------
    @Put('/update')
    @ApiBody({ type: [UserUpdateDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Update the user' })
    async putUpdate(@Body() body: UserUpdateDTO): Res<IUserPublic> {
        const payload: IUserPublic = await this._usersService.update(body.user);
        return { message: 'Successfully updated the user', payload };
    }

    //--- DELETE /delete -----------
    @Delete('/delete')
    @ApiBody({ type: [UserDeleteDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Delete the user' })
    async delete(@Body() { user }: UserDeleteDTO): Res {
        await this._usersService.delete(user.uuid, user.currentPassword);
        return { message: 'Successfully deleted the user' };
    }
}

export { UserController };
