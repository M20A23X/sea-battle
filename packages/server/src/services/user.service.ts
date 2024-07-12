import {
    BadRequestException,
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
    IRange,
    IUser,
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
import { ILoggerService, LoggerService } from '#/services/logger.service';
import { UserRepository } from '#/repositories';

interface ReadQualifier {
    userId: IUserId;
    uuid: IUuid;
    email: IEmail;
    likeUsername: IUsername;
    username: IUsername;
    range: IRange;
}

interface IUserService {
    create(data: IUserCreate): Promise<number>;
    read<T extends keyof ReadQualifier, R extends boolean>(
        qualifierType: T,
        qualifier: ReadQualifier[T],
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
    private readonly _logger: ILoggerService = new LoggerService(
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
    public static async checkPassword(
        user: IUser,
        password: string,
        logger: ILoggerService
    ): Promise<void> {
        const { lastPassword, passwordUpdatedAt } = user.credentials;

        logger.log('Checking the last password...');
        logger.debug({ user, lastPassword, passwordUpdatedAt });

        if (!compareSync(password, lastPassword))
            throw new UnauthorizedException('Invalid credentials');

        const now: number = Date.now();
        const time: number = now - passwordUpdatedAt;
        const hours: number = time / 3_600_000;
        const days: number = hours / 24;
        const months: number = days / 30;

        const message = "Passwords don't match - you changed your password ";
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

    // --- Instance --------------------

    // --- CRUD --------------------

    //--- Create -----------
    public async create(data: IUserCreate): Promise<number> {
        const { password, passwordConfirm } = data;

        this._logger.log('Creating a new user...');
        this._logger.debug({ data });

        if (password !== passwordConfirm)
            throw new BadRequestException("passwords don't match");

        try {
            const result: InsertResult = await this._repository.insert({
                ...data,
                password: hashSync(password, this._database.passwordSalt)
            });

            this._logger.debug({ result });

            return result.identifiers[0].userId;
        } catch (error: unknown) {
            this._logger.debug(error);
            throw new InternalServerErrorException();
        }
    }

    //--- Read -----------
    public async read<T extends keyof ReadQualifier, R extends boolean>(
        qualifierType: T,
        qualifier: ReadQualifier[T],
        requirePrivate: R
    ): Promise<UserType<R>[]> {
        this._logger.log('Reading the users...');
        this._logger.debug({ qualifierType, qualifier, requirePrivate });

        let repoRes: IUser[];
        switch (qualifierType) {
            case 'userId':
                const { userId } = qualifier as IUserId;
                repoRes = await this._repository.findBy({ userId });
                break;
            case 'uuid':
                const { uuid } = qualifier as IUuid;
                repoRes = await this._repository.findBy({ uuid });
                break;
            case 'email':
                const { email } = qualifier as IEmail;
                repoRes = await this._repository.findBy({ email });
                break;
            case 'username':
                const { username } = qualifier as IUsername;
                repoRes = await this._repository.findBy({ username });
                break;
            case 'likeUsername':
                const { username: template } = qualifier as IUsername;
                repoRes = await this._repository.findBy({
                    username: Like(`%${template}%`)
                });
                break;
            case 'range':
                const { start, end } = qualifier as IRange;
                repoRes = await this._repository.findBy({
                    userId: Between(start, end)
                });
                break;
            default:
                repoRes = await this._repository.find({
                    take: this._database.limitFallback
                });
                break;
        }

        if (!repoRes.length) throw new NotFoundException();

        let result: IUser[] | IUserPublic[] = repoRes;
        if (!requirePrivate) {
            result = repoRes.map(
                ({
                    userId: _,
                    password: __,
                    ...userPublic
                }: IUser): IUserPublic => userPublic
            );
        }

        this._logger.debug({ result });

        return result as UserType<R>[];
    }

    //--- Update -----------
    public async update(data: IUserUpdate): Promise<IUserPublic> {
        const { uuid, currentPassword, passwordConfirm: _, ...dbData } = data;
        const [user]: IUser[] = await this.read('uuid', { uuid }, true);

        this._logger.log('Updating the user...');
        this._logger.debug({ data, user });

        await UserService.checkPassword(user, currentPassword, this._logger);
        const result: UpdateResult = await this._repository.update(
            { uuid },
            dbData
        );

        if (data.password) user.credentials.updatePassword(data.password);
        if (data.email) user.credentials.updateVersion();

        const [updatedUser]: IUserPublic[] = await this.read(
            'uuid',
            { uuid },
            false
        );

        this._logger.debug({ result, updatedUser });

        return updatedUser;
    }

    //--- Delete -----------
    public async delete(uuid: string, currentPassword: string): Promise<void> {
        const [user]: IUser[] = await this.read('uuid', { uuid }, true);

        this._logger.log('Deleting the user...');
        this._logger.debug({ uuid, user });

        await UserService.checkPassword(user, currentPassword, this._logger);
        const result: DeleteResult = await this._repository.delete(uuid);

        this._logger.debug({ result });
    }
}

export { ReadQualifier, IUserService, UserService };
