import { IncomingHttpHeaders } from 'http';
import {
    Body,
    Controller,
    Get,
    Headers,
    Inject,
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

import { IAuthResult, ISession, MimeType, Res } from '#shared/types/interfaces';
import { AuthGuard } from '#/guards';

import { EmailDTO } from '#/modules/base';
import { SignInDTO } from '#/modules/auth';
import { UserSignUpDTO } from '#/modules/user';
import { AuthService, IAuthService } from '#/services';

interface IAuthController {
    postSignUp(origin: string, body: UserSignUpDTO): Res;
    putReset(origin: string, body: EmailDTO): Res;
    postSignIn(origin: string, body: SignInDTO): Res<IAuthResult>;
    getRefreshTokenAccess(headers: IncomingHttpHeaders): Res<ISession>;
    postSignOut(headers: IncomingHttpHeaders): Res;
}

@Controller('/auth')
class AuthController implements IAuthController {
    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(AuthService)
        private _authService: IAuthService
    ) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------

    //--- POST /signup -----------
    @Post('/signup')
    @ApiBody({ type: [UserSignUpDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Sign up a new user' })
    public async postSignUp(
        @Headers('origin') origin: string,
        @Body() body: UserSignUpDTO
    ): Res {
        await this._authService.signUp(body.auth, origin);
        return { message: 'Successfully signed up a new user' };
    }

    //--- PUT /reset -----------
    @Put('/reset')
    @ApiBody({ type: [EmailDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: "Reset the user's password" })
    public async putReset(
        @Headers('origin') origin: string,
        @Body() body: EmailDTO
    ): Res {
        await this._authService.resetPassword(body.email, origin);
        return { message: 'Successfully signed up a new user' };
    }

    //--- POST /signin -----------
    @Post('/signin')
    @ApiBody({ type: [SignInDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Sign in the user' })
    public async postSignIn(
        @Headers('origin') origin: string,
        @Body() body: SignInDTO
    ): Res<IAuthResult> {
        const payload: IAuthResult = await this._authService.signIn(
            body.auth,
            origin
        );
        return { message: 'Successfully signed in the user', payload };
    }

    //--- GET /refresh -----------
    @Get('/refresh')
    @UseGuards(AuthGuard)
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Refresh token access' })
    public async getRefreshTokenAccess(
        @Headers() headers: IncomingHttpHeaders
    ): Res<ISession> {
        const token: string = AuthService.extractRefreshToken(headers);
        const session: ISession = await this._authService.refreshTokenAccess(
            token
        );
        return {
            message: 'Successfully refreshed token access',
            payload: { ...session }
        };
    }

    //--- GET /signout -----------
    @Post('/signout')
    @UseGuards(AuthGuard)
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Refresh token access' })
    public async postSignOut(@Headers() headers: IncomingHttpHeaders): Res {
        const token: string = AuthService.extractRefreshToken(headers);
        await this._authService.signOut(token);
        return { message: 'Successfully signed out the user' };
    }
}

export { AuthController };
