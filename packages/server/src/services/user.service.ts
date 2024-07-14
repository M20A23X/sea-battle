import {
    BadRequestException,
    ConflictException,
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
import { compareSync, hashSync } from 'bcryptjs';

import {
    IEmail,
    IIdRange,
    IUser,
    IUserCreate,
    IUserId,
    IUsername,
    IUserPublic,
    IUserUpdate,
    IUuid,
    UserType
} from '#shared/types/interfaces';
import { QueryError } from 'mysql2';
import { IConfig } from '#/types';
import { IDatabaseConfig } from '#/types/interfaces';
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
    delete(uuid: string, currentPassword: string): Promise<void>;
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

    // --- Public -------------------------------------------------------------

    // --- Static --------------------

    //--- checkPassword -----------
    public static async checkPassword(
        user: IUser,
        password: string,
        logger: LoggerService
    ): Promise<void> {
        logger.log('Checking the password...');
        logger.debug({ user, password });

        if (compareSync(password, user.password)) return;

        const now: number = Date.now();
        const time: number = now - user.passwordUpdatedAt.getTime();
        const hours: number = time / 3_600_000;
        const days: number = hours / 24;
        const months: number = days / 30;

        const message = "passwords don't match - you changed your password ";
        if (months > 0) {
            throw new UnauthorizedException(
                message + months + (months > 1 ? 'months ago' : 'month ago')
            );
        }
        if (days > 0) {
            throw new UnauthorizedException(
                message + days + (days > 1 ? 'days ago' : 'day ago')
            );
        }
        if (hours > 0) {
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

    // --- Instance --------------------

    // --- CRUD --------------------

    //--- Create -----------
    public async create(data: IUserCreate): Promise<number> {
        const { password, passwordConfirm } = data;

        this._logger.log('Creating a new user...');
        this._logger.debug({ data });

        if (password !== passwordConfirm)
            throw new BadRequestException("passwords don't match");

        const passwordHash: string = hashSync(
            password,
            this._database.passwordSalt
        );

        const user = this._repository.create({
            ...data,
            password: passwordHash
        });

        try {
            const result: InsertResult = await this._repository.insert(user);

            this._logger.debug({ result });

            return result.identifiers?.[0].userId;
        } catch (error: unknown) {
            if ((error as QueryError)?.code === 'ER_DUP_ENTRY') {
                throw new ConflictException(
                    'user with this credentials already exists'
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

        let result: IUser[] | IUserPublic[] = repoRes;
        if (!requirePrivate)
            result = repoRes.map(UserService.extractUserPublic);

        this._logger.debug({ result });

        return result as UserType<R>[];
    }

    //--- Update -----------
    public async update(data: IUserUpdate): Promise<IUserPublic> {
        const { uuid, currentPassword, passwordConfirm, ...dbData } = data;
        const [user]: IUser[] = await this.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        this._logger.log('Updating the user...');
        this._logger.debug({ data, user });

        if (!Object.entries(dbData).length)
            throw new BadRequestException('nothing to update');

        await UserService.checkPassword(user, currentPassword, this._logger);

        if (dbData.password !== passwordConfirm)
            throw new BadRequestException("passwords don't match");
        if (dbData.password) user.setPassword = dbData.password;

        user.updateVersion();

        const result: UpdateResult = await this._repository.update(
            { uuid },
            { ...user, ...dbData }
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
    public async delete(uuid: string, currentPassword: string): Promise<void> {
        const [user]: IUser[] = await this.read(
            ReadParamEnum.Uuid,
            { uuid },
            true
        );

        this._logger.log('Deleting the user...');
        this._logger.debug({ uuid, user });

        await UserService.checkPassword(user, currentPassword, this._logger);
        const result: DeleteResult = await this._repository.delete({ uuid });

        this._logger.debug({ result });
    }
}

export { ReadParamEnum, UserService };
