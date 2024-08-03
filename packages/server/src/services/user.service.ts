import { QueryError } from 'mysql2';
import CryptoJS from 'crypto-js';
import {
    BadRequestException,
    ConflictException,
    ConsoleLogger,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import {
    Between,
    DeleteResult,
    InsertResult,
    Like,
    UpdateResult
} from 'typeorm';
import { ConfigService } from '@nestjs/config';

import {
    IEmail,
    IIdRange,
    IUser,
    IUserBase,
    IUserCreate,
    IUserId,
    IUsername,
    IUserPublic,
    IUserUpdate,
    IUuid,
    UserType
} from '#shared/types/interfaces';
import { IConfig } from '#/types';
import { IDatabaseConfig } from '#/types/interfaces';

import { UserEntity } from '#/modules/user';
import { LoggerService } from '#/services';
import { UserRepository } from '#/repositories';

enum ReadParamEnum {
    UserId = 'userId',
    Uuid = 'uuid',
    Email = 'email',
    Username = 'username',
    IdRange = 'range'
}
interface ReadParam {
    [ReadParamEnum.UserId]: IUserId;
    [ReadParamEnum.Uuid]: IUuid;
    [ReadParamEnum.Email]: IEmail;
    [ReadParamEnum.Username]: IUsername;
    [ReadParamEnum.IdRange]: IIdRange;
}

interface IUserService {
    create(data: IUserCreate): Promise<number>;
    read<T extends keyof ReadParam, R extends boolean>(
        qualifierType: T,
        qualifier: ReadParam[T],
        requirePrivate: R
    ): Promise<UserType<R>[]>;
    update(data: IUserUpdate): Promise<IUserPublic>;
    delete(uuid: string): Promise<void>;
}

@Injectable()
class UserService implements IUserService {
    // --- Configs -------------------------------------------------------------
    private readonly _database: IDatabaseConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: LoggerService = new LoggerService(
        UserService.name
    );

    // --- Constructor -------------------------------------------------------------
    constructor(
        private readonly _configService: ConfigService<IConfig>,
        @Inject(UserRepository)
        private readonly _repository: UserRepository
    ) {
        this._logger.log('Initializing a User service...');
        this._database = this._configService.getOrThrow('database');
    }

    // --- Static -------------------------------------------------------------

    // --- Private -------------------------------------------------------------

    //--- _encryptPassword -----------
    private static _encryptPassword(
        password: string,
        secret: string,
        logger: ConsoleLogger
    ): string {
        logger.log('Ciphering the password...');
        logger.debug({ password, secret });

        const cipheredWords: CryptoJS.lib.CipherParams = CryptoJS.AES.encrypt(
            password,
            secret
        );

        const ciphered: string = cipheredWords.toString();

        logger.debug({ ciphered });

        return ciphered;
    }

    // --- Public -------------------------------------------------------------

    //--- decryptPassword -----------
    public static decryptPassword(
        encrypted: string,
        secret: string,
        logger: ConsoleLogger
    ): string {
        logger.log('Deciphering the encrypted password...');
        logger.debug({ encrypted, secret });

        const decipheredWords: CryptoJS.lib.WordArray = CryptoJS.AES.decrypt(
            encrypted,
            secret
        );

        const deciphered: string = decipheredWords.toString(CryptoJS.enc.Utf8);

        logger.debug({ deciphered });

        return deciphered;
    }

    //--- checkPassword -----------
    // eslint-disable-next-line sonarjs/cognitive-complexity
    public static checkPassword<Q extends boolean>(
        userOrPassword: Q extends true ? string : IUser,
        password: string,
        isQuick: Q,
        isAuth: boolean,
        secret: string,
        logger: LoggerService
    ): void {
        logger.log('Checking the password...');
        logger.debug({ userOrPassword, password });

        if (typeof userOrPassword !== 'object') {
            if (password !== userOrPassword) {
                const exception = isAuth
                    ? UnauthorizedException
                    : BadRequestException;
                throw new exception("passwords don't match");
            } else return;
        } else {
            const decryptedPassword: string = UserService.decryptPassword(
                userOrPassword.password,
                secret,
                logger
            );
            if (password === decryptedPassword) return;
        }

        const time: number =
            Date.now() - userOrPassword.credentials.passwordUpdatedAt.getTime();
        const hours: number = time / 3_600_000;
        const days: number = hours / 24;
        const months: number = days / 30;

        const message = "passwords don't match - you changed your password ";
        if (months > 1) {
            throw new UnauthorizedException(
                message + months + (months > 1 ? 'months ago' : 'month ago')
            );
        }
        if (days > 1) {
            throw new UnauthorizedException(
                message + days + (days > 1 ? 'days ago' : 'day ago')
            );
        }
        if (hours > 1) {
            throw new UnauthorizedException(
                message + hours + (hours > 1 ? 'hours ago' : 'hour ago')
            );
        }
        throw new UnauthorizedException(message + 'recently');
    }

    //--- extractUserPublic -----------
    public static extractUserPublic(user: IUser): IUserPublic {
        return {
            uuid: user.uuid,
            email: user.email,
            username: user.username,
            imgPath: user.imgPath
        };
    }

    // --- Instance -------------------------------------------------------------

    // --- CRUD --------------------

    //--- Create -----------
    public async create(data: IUserCreate): Promise<number> {
        const { passwordSet } = data;

        this._logger.log('Creating a new user...');
        this._logger.debug({ data });

        UserService.checkPassword(
            data.passwordSet.password,
            data.passwordSet.passwordConfirm,
            true,
            false,
            this._database.passwordSecret,
            this._logger
        );
        const encryptedPassword: string = UserService._encryptPassword(
            passwordSet.password,
            this._database.passwordSecret,
            this._logger
        );
        const user: UserEntity = this._repository.create({
            ...data,
            password: encryptedPassword
        });

        try {
            const result: InsertResult = await this._repository.insert(user);

            this._logger.debug({ result });

            return result.identifiers?.[0].userId;
        } catch (error: unknown) {
            if ((error as QueryError)?.code === 'ER_DUP_ENTRY') {
                throw new ConflictException(
                    'user with specified credentials already exists'
                );
            }
            throw new InternalServerErrorException();
        }
    }

    //--- Read -----------
    public async read<T extends ReadParamEnum, R extends boolean>(
        paramType: T,
        param: ReadParam[T],
        requirePrivate: R
    ): Promise<UserType<R>[]> {
        this._logger.log('Reading the users...');
        this._logger.debug({ paramType, param, requirePrivate });

        let repoRes: IUser[];
        switch (paramType) {
            case ReadParamEnum.UserId:
                repoRes = await this._repository.findBy(param as IUserId);
                break;
            case ReadParamEnum.Uuid:
                repoRes = await this._repository.findBy(param as IUuid);
                break;
            case ReadParamEnum.Email:
                repoRes = await this._repository.findBy(param as IEmail);
                break;
            case ReadParamEnum.Username:
                const { username } = param as IUsername;
                repoRes = await this._repository.findBy({
                    username: Like(`%${username}%`)
                });
                break;
            case ReadParamEnum.IdRange:
                const { startId, endId } = param as IIdRange;
                repoRes = await this._repository.findBy({
                    userId: Between(
                        startId,
                        endId ?? this._database.limitFallback
                    )
                });
                break;
            default:
                throw new BadRequestException('incorrect request');
        }

        if (!repoRes.length)
            throw new NotFoundException("user with specified data isn't found");

        const result: IUserPublic[] = requirePrivate
            ? repoRes
            : repoRes.map(UserService.extractUserPublic);

        this._logger.debug({ result });

        return result as UserType<R>[];
    }

    //--- Update -----------
    public async update(data: IUserUpdate): Promise<IUserPublic> {
        const { uuid, passwordSet } = data;

        const dbData: Partial<IUserBase> = {
            email: data.email,
            username: data.username,
            imgPath: data.imgPath
        };

        const [user]: IUser[] = await this.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        this._logger.log('Updating the user...');
        this._logger.debug({ data, user });

        const isDataEmpty = !Object.entries({ ...dbData, passwordSet }).length;
        if (isDataEmpty) throw new BadRequestException('nothing to update');

        if (passwordSet?.password) {
            UserService.checkPassword(
                passwordSet.password,
                passwordSet.passwordConfirm,
                true,
                false,
                this._database.passwordSecret,
                this._logger
            );
            const encryptedPassword: string = UserService._encryptPassword(
                passwordSet.password,
                this._database.passwordSecret,
                this._logger
            );
            UserEntity.updatePassword(user, encryptedPassword);
        }

        const result: UpdateResult = await this._repository.updateEntity(
            { ...user, ...dbData },
            this._logger
        );

        const [updatedUser]: IUserPublic[] = await this.read(
            ReadParamEnum.Uuid,
            { uuid },
            false
        );

        this._logger.debug({ updatedUser, result });

        return updatedUser;
    }

    //--- Delete -----------
    public async delete(uuid: string): Promise<void> {
        const [user]: IUser[] = await this.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        this._logger.log('Deleting the user...');
        this._logger.debug({ uuid, user });

        const result: DeleteResult = await this._repository.delete({ uuid });

        this._logger.debug({ result });
    }
}

export { ReadParamEnum, UserService };
