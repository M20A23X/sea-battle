import { JwtPayload } from 'jsonwebtoken';
import { IUsername, IUuid } from '#/types/interfaces/base.interface';

enum TokenTypeEnum {
    ACCESS = 'access',
    REFRESH = 'refresh',
    CONFIRMATION = 'confirmation',
    RESET_PASSWORD = 'resetPassword'
}
interface IToken {
    token: string;
}
interface IJwtTime {
    timeMs: number;
}

interface IAccessPayload extends IUuid, IUsername {}
interface IEmailPayload extends IAccessPayload {
    version: number;
}
interface IRefreshPayload extends IEmailPayload, IToken {}

interface IAccessToken extends Required<JwtPayload>, IAccessPayload {}
interface IEmailToken extends Required<JwtPayload>, IEmailPayload {}
interface IRefreshToken extends Required<JwtPayload>, IRefreshPayload {}

interface ISingleJwt extends IJwtTime {
    secret: string;
}
interface IAccessJwt extends IJwtTime {
    publicKey: string;
    privateKey: string;
}

interface IJwtConfig {
    tokens: {
        [TokenTypeEnum.ACCESS]: IAccessJwt;
        [TokenTypeEnum.REFRESH]: ISingleJwt;
        [TokenTypeEnum.CONFIRMATION]: ISingleJwt;
        [TokenTypeEnum.RESET_PASSWORD]: ISingleJwt;
    };
}
interface IJwtDefault {
    tokens: Record<keyof IJwtConfig['tokens'], IJwtTime>;
}

export {
    TokenTypeEnum,
    IToken,
    IJwtConfig,
    IJwtDefault,
    ISingleJwt,
    IAccessJwt,
    IAccessPayload,
    IRefreshPayload,
    IEmailPayload,
    IAccessToken,
    IRefreshToken,
    IEmailToken
};
