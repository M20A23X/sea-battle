import { IncomingHttpHeaders } from 'http';
import {
    Body,
    Controller,
    Headers,
    Inject,
    Ip,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProduces } from '@nestjs/swagger';

import type { PromiseRes } from 'shared/types/requestResponse';
import type { TAccessTokenRes, TSignInRes } from 'shared/types/auth';

import { MIME_TYPE } from 'shared/static/web';

import { SignInDTO } from 'modules/auth/models/dtos/signIn.dto';

import { AuthGuard } from 'guards/auth.guard';
import { AuthService } from 'services/auth.service';

interface IAuthController {
    postSignInUser(
        accessIpv6: string,
        signInData: SignInDTO,
    ): PromiseRes<TSignInRes>;

    getRefreshAccessToken(
        headers: IncomingHttpHeaders,
        accessIpv6: string,
    ): PromiseRes<TAccessTokenRes>;
}

@Controller('/auth')
export class AuthController implements IAuthController {
    constructor(
        @Inject(AuthService)
        private _authService: AuthService,
    ) {}

    ///--- Public ---///
    @Post('/signin')
    @ApiBody({ type: [SignInDTO] })
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Sign In user' })
    public async postSignInUser(
        @Ip() accessIpv6: string,
        @Body() body: SignInDTO,
    ): PromiseRes<TSignInRes> {
        const { username, password } = body || {};
        return await this._authService.signIn(username, password, accessIpv6);
    }

    @Put('/refresh')
    @UseGuards(AuthGuard)
    @ApiBody({ type: [SignInDTO] })
    @ApiOperation({ summary: 'Refresh access token' })
    public async getRefreshAccessToken(
        @Headers() headers: IncomingHttpHeaders,
        @Ip() accessIpv6: string,
    ): PromiseRes<TAccessTokenRes> {
        const { 'x-refresh-token': token } = headers || {};
        return await this._authService.refreshAccessToken(token, accessIpv6);
    }
}
