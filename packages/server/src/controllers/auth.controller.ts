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
import { Route } from '#shared/static';

import { AuthGuard } from '#/guards';

import {
    ConfirmationTokenDTO,
    RefreshTokenAccessDTO,
    RequestPasswordResetDTO,
    ResetPasswordDTO,
    SignInDTO,
    SignOutDTO,
    SignUpDTO
} from '#/modules/auth';
import { AuthService } from '#/services';

interface IAuthController {
    postSignUp(origin: string, body: SignUpDTO): Res;
    putConfirm(body: ConfirmationTokenDTO): Res;
    putReset(body: ResetPasswordDTO): Res;
    postSignIn(origin: string, body: SignInDTO): Res<IAuthResult>;
    getRefreshTokenAccess(body: RefreshTokenAccessDTO): Res<ISession>;
    postSignOut(body: SignOutDTO): Res;
}

@Controller(Route.auth.index)
class AuthController implements IAuthController {
    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(AuthService)
        private _authService: AuthService
    ) {}

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------

    //--- POST /signup -----------
    @Post(Route.auth.signup)
    @ApiBody({ type: [SignUpDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Sign up a new user' })
    public async postSignUp(
        @Headers('origin') origin: string,
        @Body() body: SignUpDTO
    ): Res {
        await this._authService.signUp(body.auth, origin);
        return { message: 'Successfully signed up a new user' };
    }

    //--- Put /confirm -----------
    @Put(Route.auth.emailConfirmation)
    @ApiBody({ type: [ConfirmationTokenDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Confirm the user' })
    public async putConfirm(@Body() body: ConfirmationTokenDTO): Res {
        await this._authService.confirmEmail(body.auth.token);
        return { message: 'Successfully confirmed the user' };
    }

    //--- GET /reset -----------
    @Get(Route.auth.passwordResetRequest)
    @ApiBody({ type: [RequestPasswordResetDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: "Reset the user's password" })
    public async putSendReset(
        @Headers('origin') origin: string,
        @Body() body: RequestPasswordResetDTO
    ): Res {
        await this._authService.sendResetPasswordToken(body.auth.email, origin);
        return {
            message: 'Successfully sent a link for password resetting'
        };
    }
    //--- PUT /reset -----------
    @Put(Route.auth.passwordResetting)
    @ApiBody({ type: [ResetPasswordDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: "Reset the user's password" })
    public async putReset(@Body() body: ResetPasswordDTO): Res {
        await this._authService.resetPassword(
            body.auth.passwordSet.password,
            body.auth.passwordSet.passwordConfirm,
            body.auth.token
        );
        return { message: 'Successfully set a new password' };
    }

    //--- POST /signin -----------
    @Post(Route.auth.signIn)
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
    @Get(Route.auth.accessRefresh)
    @ApiBody({ type: [RefreshTokenAccessDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Refresh token access' })
    public async getRefreshTokenAccess(
        @Body() body: RefreshTokenAccessDTO
    ): Res<ISession> {
        const session: ISession = await this._authService.refreshTokenAccess(
            body.auth.token
        );
        return {
            message: 'Successfully refreshed token access',
            payload: { ...session }
        };
    }

    //--- GET /signout -----------
    @Post(Route.auth.signOut)
    @UseGuards(AuthGuard)
    @ApiBody({ type: [SignOutDTO] })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Sign out the user' })
    public async postSignOut(@Body() body: SignOutDTO): Res {
        await this._authService.signOut(body.auth.token);
        return { message: 'Successfully signed out the user' };
    }
}

export { AuthController };
