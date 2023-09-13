import { IncomingHttpHeaders } from 'http';
import {
    Body,
    Controller,
    Headers,
    Inject,
    Ip,
    Post,
    Put,
    UseGuards
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces
} from '@nestjs/swagger';

import type { PromiseRes } from 'shared/types/requestResponse';
import type { AccessTokenRes, SignInRes } from 'shared/types/auth';

import { MIME_TYPE } from 'shared/static/web';

import { SignInDTO } from 'modules/auth/models/dtos/signIn.dto';

import { AuthGuard } from 'guards/auth.guard';
import { AuthService } from 'services/auth.service';

interface IAuthController {
    postSignInUser(
        accessIpv6: string,
        signInData: SignInDTO
    ): PromiseRes<SignInRes>;

    getRefreshAccessToken(
        headers: IncomingHttpHeaders,
        accessIpv6: string
    ): PromiseRes<AccessTokenRes>;
}

@Controller('/auth')
export class AuthController implements IAuthController {
    constructor(
        @Inject(AuthService)
        private _authService: AuthService
    ) {}

    ///--- Public ---///
    @Post('/signin')
    @ApiBody({ type: [SignInDTO] })
    @ApiConsumes(MIME_TYPE.applicationJson)
    @ApiProduces(MIME_TYPE.applicationJson)
    @ApiOperation({ summary: 'Sign In user' })
    public async postSignInUser(
        @Ip() accessIpv6: string,
        @Body() body: SignInDTO
    ): PromiseRes<SignInRes> {
        const { username, password } = body.user;
        return await this._authService.signIn(username, password, accessIpv6);
    }

    @Put('/refresh')
    @UseGuards(AuthGuard)
    @ApiOperation({ summary: 'Refresh access token' })
    public async getRefreshAccessToken(
        @Headers() headers: IncomingHttpHeaders,
        @Ip() accessIpv6: string
    ): PromiseRes<AccessTokenRes> {
        const { 'x-refresh-token': token } = headers || {};
        return await this._authService.refreshAccessToken(token, accessIpv6);
    }
}
