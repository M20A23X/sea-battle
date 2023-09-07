import { IncomingHttpHeaders } from 'http';
import { Response } from 'express';
import {
    Body,
    Controller,
    Headers,
    Inject,
    Ip,
    Post,
    Put,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProduces } from '@nestjs/swagger';

import type { ControllerRes, ServiceRes } from 'shared/types/requestResponse';
import type { TRefreshJwtRes, TSignInRes } from 'shared/types/auth';

import { requireSendControllerRes } from 'utils/res.util';

import { MIME_TYPE } from 'static/web';

import { User } from 'modules/user/models/entities/user.entity';
import { SignInDTO } from 'modules/auth/models/dtos/signIn.dto';

import { AuthGuard } from 'guards/auth.guard';
import { AuthService } from 'services/auth.service';

interface IAuthController {
    postSignInUser(
        accessIpv6: string,
        signInData: SignInDTO,
        res: Response,
    ): ControllerRes<TSignInRes>;

    getRefreshJwtToken(
        headers: IncomingHttpHeaders,
        accessIpv6: string,
        res: Response,
    ): ControllerRes<TRefreshJwtRes>;
}

@Controller('/auth')
export class AuthController implements IAuthController {
    constructor(
        @Inject(AuthService)
        private _authService: AuthService,
    ) {}

    ///--- Private ---///
    private readonly _sendUserRes = requireSendControllerRes(User.name);
    private readonly _sendTokenRes = requireSendControllerRes('access token');

    ///--- Public ---///
    @Post('/signin')
    @ApiBody({ type: [SignInDTO] })
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Sign In user' })
    public async postSignInUser(
        @Ip() accessIpv6: string,
        @Body() body: SignInDTO,
        @Res() res: Response,
    ): ControllerRes<TSignInRes> {
        const { username, password } = body || {};
        const serviceRes: ServiceRes<TSignInRes> =
            await this._authService.signIn(username, password, accessIpv6);
        return this._sendUserRes(serviceRes, res);
    }

    @Put('/refresh')
    @UseGuards(AuthGuard)
    @ApiBody({ type: [SignInDTO] })
    @ApiOperation({ summary: 'Refresh access token' })
    public async getRefreshJwtToken(
        @Headers() headers: IncomingHttpHeaders,
        @Ip() accessIpv6: string,
        @Res() res: Response,
    ): ControllerRes<TRefreshJwtRes> {
        const { 'x-refresh-token': token } = headers || {};
        if (!token) {
            const response: ServiceRes<TRefreshJwtRes> = {
                isSuccess: false,
                serviceCode: 'UNAUTHORIZED',
                message: 'no refresh token provided',
                operation: 'REFRESH',
                payload: null,
            };
            return this._sendTokenRes(response, res);
        }

        const serviceRes: ServiceRes<TRefreshJwtRes> =
            await this._authService.refreshJwtToken(token, accessIpv6);

        return this._sendTokenRes(serviceRes, res);
    }
}
