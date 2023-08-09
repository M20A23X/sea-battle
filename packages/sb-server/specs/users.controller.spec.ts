import process from 'process';
import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
    ACTION_RANDOM_PERCENT,
    CONNECTION_CHECK_INTERVAL,
    DATA_AMOUNT,
    HOOK_TIMEOUT,
} from './static/globals';

import {
    random,
    randomizeAction,
    randomRange,
    randomString,
} from './utils/random';

import { TResponse } from 'types/requestResponse';
import { IResponseService, ResponseService } from 'services/response.service';
import {
    TUserCreateDbData,
    UsersRepository,
} from 'repositories/users.repository';
import { UsersService } from 'services/users.service';
import {
    IUsersController,
    UsersController,
} from 'controllers/users/users.controller';

import {
    IUser,
    IUserPublicData,
    User,
} from 'modules/user/models/entities/user.entity';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UsersReadDTO } from 'modules/user/models/dtos/usersRead.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';

import { USERS_SCHEMA } from 'static/database';
import { DataSourceProvider } from 'configs/dataSource.config';

const { username, password, imgUrl } = USERS_SCHEMA;

const IMG_URL_MIN_LENGTH = 5;
const UUID_LENGTH = 36;

const userDataArr: IUser[] = new Array(DATA_AMOUNT).fill(null).map(() => {
    const user: IUser = new User();
    user.userUUID = '';
    user.username = randomString(username.maxLength, username.minLength);
    user.password = randomString(password.maxLength, password.minLength);
    user.imgUrl = randomString(imgUrl.maxLength, IMG_URL_MIN_LENGTH);
    return user;
});

const createUsersCreateDTO = (): UserCreateDTO[] => {
    return userDataArr.map((u) => {
        const { userUUID: _, userId: __, ...rest } = u;
        return {
            user: { ...rest, passwordConfirm: rest.password },
        };
    });
};

describe('User controller tests.', () => {
    let dataSource: DataSource;
    let resService: IResponseService;
    let usersController: IUsersController;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: `.env.${process.env.NODE_ENV}`,
                }),
            ],
            controllers: [UsersController],
            providers: [UsersService, UsersRepository, DataSourceProvider],
        }).compile();

        dataSource = module.get<DataSource>(DataSource);
        usersController = module.get<IUsersController>(UsersController);
        resService = new ResponseService(UsersService.name);
    }, HOOK_TIMEOUT);

    beforeEach(async () => {
        return new Promise<void>((resolve) => {
            const interval: NodeJS.Timer = setInterval(() => {
                if (dataSource.isInitialized) {
                    clearInterval(interval);
                    return resolve();
                }
            }, CONNECTION_CHECK_INTERVAL).unref();
        });
    });

    afterEach(async () => {
        await dataSource.getRepository(User).clear();
    }, HOOK_TIMEOUT);

    afterAll(async () => {
        await dataSource.destroy();
    }, HOOK_TIMEOUT);

    ///--- /POST CREATE ---///
    it(
        '/POST CREATE: should successfully create a new users',
        async () => {
            const reqArr: UserCreateDTO[] = userDataArr.map(
                (dto): UserCreateDTO => {
                    const { userUUID: _, userId: __, ...rest } = dto;
                    return {
                        user: { ...rest, passwordConfirm: rest.password },
                    };
                },
            );
            const expectedResArr: TResponse[] = reqArr.map((dto) => {
                return resService.getSuccessRes('CREATE', {
                    username: dto.user.username,
                });
            });
            const resArr: TResponse[] = [];

            for (const dto of reqArr) {
                const res = await usersController.postCreateUser(dto);
                resArr.push(res);
            }
            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/POST CREATE: should prevent create new users with incorrect length of props',
        async () => {
            const fallback: Omit<TUserCreateDbData, 'password'> = {
                username: '',
                imgUrl: '',
            };
            const keys = Object.keys(fallback);
            const reqArr: UserCreateDTO[] = userDataArr.map((dto) => {
                const { userUUID: _, userId: __, ...rest } = dto;
                const key = keys[random(keys.length - 1)];
                const value = randomString(
                    USERS_SCHEMA[key].maxLength,
                    IMG_URL_MIN_LENGTH,
                    true,
                );
                return {
                    user: {
                        ...rest,
                        passwordConfirm: rest.password,
                        [key]: value,
                    },
                };
            });
            const expectedResArr: TResponse[] = reqArr.map((dto) => {
                let res: TResponse;
                const [key] =
                    Object.entries(dto.user).find(([key, value]) => {
                        const isCorrect =
                            USERS_SCHEMA?.[key] === undefined ||
                            (typeof value === 'string' &&
                                value.length <= USERS_SCHEMA?.[key]?.maxLength);
                        if (!isCorrect) return [key, value];
                    }) || [];
                if (key) {
                    res = resService.getWarnRes(
                        'CREATE',
                        `'${key}' must be not greater than ${USERS_SCHEMA[key]?.maxLength} symbols`,
                    );
                } else {
                    res = resService.getSuccessRes('CREATE', {
                        username: dto.user.username,
                    });
                }
                return res;
            });
            const resArr: TResponse[] = [];

            for (const dto of reqArr) {
                const res = await usersController.postCreateUser(dto);
                resArr.push(res);
            }
            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    ///--- /GET READ ---///
    it(
        '/GET READ: should successfully get users with similar usernames OR by range',
        async () => {
            const expectedResArr: TResponse<IUserPublicData[]>[] = [];
            const reqArr: UsersReadDTO[] = [];
            const createReqArr: UserCreateDTO[] = userDataArr.map(
                (dto): UserCreateDTO => {
                    const { userUUID: _, userId: __, ...rest } = dto;
                    const readDto: UsersReadDTO = new UsersReadDTO();
                    let readUsers: IUser[] = [];
                    randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => {
                            const [startId, endId] = randomRange(
                                dto.username.length,
                            );
                            readDto.username = dto.username.slice(
                                startId,
                                endId,
                            );
                            readUsers = userDataArr.filter((u) =>
                                u.username.includes(readDto?.username || ''),
                            );
                        },
                        () => {
                            const [startId, endId] = randomRange(
                                DATA_AMOUNT,
                                1,
                            );
                            readDto.startId = startId;
                            readDto.endId = endId;
                            readUsers = userDataArr.slice(startId - 1, endId);
                        },
                    );
                    const expectedResPayload: IUserPublicData[] = readUsers.map(
                        (u) => {
                            const { userId: _, password: __, ...rest } = u;
                            return { ...rest, userUUID: '' };
                        },
                    );
                    const expectedRes: TResponse<IUserPublicData[]> =
                        resService.getSuccessRes(
                            'READ',
                            { amount: expectedResPayload.length },
                            expectedResPayload,
                        );

                    expectedResArr.push(expectedRes);
                    reqArr.push(readDto);
                    return {
                        user: { ...rest, passwordConfirm: rest.password },
                    };
                },
            );

            const resArr: TResponse<IUserPublicData[]>[] = [];
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            for (const dto of reqArr) {
                const res = await usersController.getReadUsers(dto);
                const payload: IUserPublicData[] | null =
                    res.payload?.map((dto) => ({
                        ...dto,
                        userUUID: '',
                    })) || null;
                const resMapped: TResponse<IUserPublicData[]> = {
                    message: res.message,
                    payload,
                };
                resArr.push(resMapped);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/GET READ: should successfully get users empty array because of no exist usernames NOR ids',
        async () => {
            const expectedResArr: TResponse<IUserPublicData[]>[] = [];
            const reqArr: UsersReadDTO[] = [];
            const createReqArr: UserCreateDTO[] = userDataArr.map(
                (dto): UserCreateDTO => {
                    const { userUUID: _, userId: __, ...rest } = dto;
                    const readDto: UsersReadDTO = new UsersReadDTO();
                    randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => {
                            readDto.username = dto.username + 'c';
                        },
                        () => {
                            readDto.startId = DATA_AMOUNT + 1;
                            readDto.endId = DATA_AMOUNT * 2;
                        },
                    );
                    const expectedRes: TResponse<IUserPublicData[]> =
                        resService.getSuccessRes('READ', { amount: 0 }, []);

                    expectedResArr.push(expectedRes);
                    reqArr.push(readDto);
                    return {
                        user: { ...rest, passwordConfirm: rest.password },
                    };
                },
            );

            const resArr: TResponse<IUserPublicData[]>[] = [];
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            for (const dto of reqArr) {
                const res: TResponse<IUserPublicData[]> =
                    await usersController.getReadUsers(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    ///--- /PUT UPDATE ---///
    it(
        '/PUT UPDATE: should successfully update users info',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse<IUserPublicData>[] = [];
            const reqArr: UserUpdateDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const updateDto: UserUpdateDTO = new UserUpdateDTO();
                    const updateUserPassword: string = randomString(
                        USERS_SCHEMA.password.maxLength,
                        USERS_SCHEMA.password.minLength,
                    );
                    updateDto.user = {
                        userUUID: u.userUUID,
                        username: randomString(
                            USERS_SCHEMA.username.maxLength,
                            USERS_SCHEMA.username.minLength,
                        ),
                        password: updateUserPassword,
                        passwordConfirm: updateUserPassword,
                        currentPassword: createReqArr[index].user.password,
                        imgUrl: randomString(
                            USERS_SCHEMA.imgUrl.maxLength,
                            IMG_URL_MIN_LENGTH,
                        ),
                    };

                    const updateUser: IUser = new User();
                    updateUser.userUUID = u.userUUID;
                    updateUser.username = updateDto.user?.username || '';
                    updateUser.imgUrl = updateDto.user?.imgUrl || '';
                    const {
                        userId: _,
                        password: __,
                        ...updateUserPublic
                    } = updateUser;
                    const expectedRes: TResponse<IUserPublicData> =
                        resService.getSuccessRes(
                            'UPDATE',
                            { UUID: u.userUUID },
                            updateUserPublic,
                        );
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            const resArr: TResponse<IUserPublicData>[] = [];
            for (const dto of reqArr) {
                const res: TResponse<IUserPublicData> =
                    await usersController.putUpdateUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/PUT UPDATE: should prevent update users with incorrect UUID',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse<IUserPublicData>[] = [];
            const reqArr: UserUpdateDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const updateUserPassword: string = randomString(
                        USERS_SCHEMA.password.maxLength,
                        USERS_SCHEMA.password.minLength,
                    );
                    const updateDto: UserUpdateDTO = new UserUpdateDTO();
                    updateDto.user = {
                        userUUID: randomizeAction(
                            ACTION_RANDOM_PERCENT,
                            () => u.userUUID,
                            () => randomString(UUID_LENGTH, UUID_LENGTH),
                        ),
                        username: randomString(
                            USERS_SCHEMA.username.maxLength,
                            USERS_SCHEMA.username.minLength,
                        ),
                        password: updateUserPassword,
                        passwordConfirm: updateUserPassword,
                        currentPassword: createReqArr[index].user.password,
                        imgUrl: randomString(
                            USERS_SCHEMA.imgUrl.maxLength,
                            IMG_URL_MIN_LENGTH,
                        ),
                    };

                    const updateUser: IUser = new User();
                    updateUser.userUUID = u.userUUID;
                    updateUser.username = updateDto.user?.username || '';
                    updateUser.imgUrl = updateDto.user?.imgUrl || '';
                    const {
                        userId: _,
                        password: __,
                        ...updateUserPublic
                    } = updateUser;
                    let expectedRes: TResponse<IUserPublicData>;
                    if (updateDto.user.userUUID === u.userUUID) {
                        expectedRes = resService.getSuccessRes(
                            'UPDATE',
                            {
                                UUID: updateDto.user.userUUID,
                            },
                            updateUserPublic,
                        );
                    } else {
                        expectedRes = resService.getWarnRes(
                            'UPDATE',
                            'DOESNT_EXIST',
                            { UUID: updateDto.user.userUUID },
                        );
                    }
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            const resArr: TResponse<IUserPublicData>[] = [];
            for (const dto of reqArr) {
                const res: TResponse<IUserPublicData> =
                    await usersController.putUpdateUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/PUT UPDATE: should reject update users with incorrect current password confirmation',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse<IUserPublicData>[] = [];
            const reqArr: UserUpdateDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const updateDto: UserUpdateDTO = new UserUpdateDTO();
                    const updatePassword: string = randomString(
                        USERS_SCHEMA.password.maxLength,
                        USERS_SCHEMA.password.minLength,
                    );
                    const currentPassword: string =
                        createReqArr[index].user.password;

                    updateDto.user = {
                        userUUID: u.userUUID,
                        username: randomString(
                            USERS_SCHEMA.username.maxLength,
                            USERS_SCHEMA.username.minLength,
                        ),
                        password: updatePassword,
                        passwordConfirm: updatePassword,
                        currentPassword: randomizeAction(
                            ACTION_RANDOM_PERCENT,
                            () => createReqArr[index].user.password,
                            () =>
                                randomString(
                                    USERS_SCHEMA.password.maxLength,
                                    USERS_SCHEMA.username.minLength,
                                ),
                        ),
                        imgUrl: randomString(
                            USERS_SCHEMA.imgUrl.maxLength,
                            IMG_URL_MIN_LENGTH,
                        ),
                    };

                    let expectedRes: TResponse<IUserPublicData>;
                    if (updateDto.user.currentPassword === currentPassword) {
                        const updateUser: IUser = new User();
                        updateUser.userUUID = u.userUUID;
                        updateUser.username = updateDto.user?.username || '';
                        updateUser.imgUrl = updateDto.user?.imgUrl || '';
                        const {
                            userId: _,
                            password: __,
                            ...updateUserPublic
                        } = updateUser;
                        expectedRes = resService.getSuccessRes(
                            'UPDATE',
                            { UUID: u.userUUID },
                            updateUserPublic,
                        );
                    } else {
                        expectedRes = resService.getWarnRes(
                            'UPDATE',
                            'INCORRECT_PASSWORD',
                        );
                    }
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            const resArr: TResponse<IUserPublicData>[] = [];
            for (const dto of reqArr) {
                const res: TResponse<IUserPublicData> =
                    await usersController.putUpdateUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    ///--- /DELETE DELETE ---///
    it(
        '/DELETE DELETE: should success delete users',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse[] = [];
            const reqArr: UserDeleteDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const deleteDto: UserDeleteDTO = new UserDeleteDTO();
                    deleteDto.userUUID = u.userUUID;
                    deleteDto.currentPassword =
                        createReqArr[index].user.password;

                    const expectedRes: TResponse = resService.getSuccessRes(
                        'DELETE',
                        { UUID: u.userUUID },
                    );
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            const resArr: TResponse[] = [];
            for (const dto of reqArr) {
                const res: TResponse = await usersController.deleteUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/DELETE DELETE: should prevent delete users with incorrect UUID',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse[] = [];
            const reqArr: UserDeleteDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const deleteDto: UserDeleteDTO = new UserDeleteDTO();
                    deleteDto.userUUID = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => u.userUUID,
                        () => randomString(UUID_LENGTH, UUID_LENGTH),
                    );
                    deleteDto.currentPassword =
                        createReqArr[index].user.password;

                    let expectedRes: TResponse;
                    if (deleteDto.userUUID === u.userUUID) {
                        expectedRes = resService.getSuccessRes('DELETE', {
                            UUID: deleteDto.userUUID,
                        });
                    } else {
                        expectedRes = resService.getWarnRes(
                            'DELETE',
                            'DOESNT_EXIST',
                            { UUID: deleteDto.userUUID },
                        );
                    }
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            const resArr: TResponse[] = [];
            for (const dto of reqArr) {
                const res: TResponse = await usersController.deleteUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );

    it(
        '/DELETE DELETE: should prevent delete users with incorrect password confirmation',
        async () => {
            const createReqArr: UserCreateDTO[] = createUsersCreateDTO();
            for (const dto of createReqArr)
                await usersController.postCreateUser(dto);

            const readReq: UsersReadDTO = new UsersReadDTO();
            readReq.startId = 1;
            readReq.endId = DATA_AMOUNT;
            const readRes: TResponse<IUserPublicData[]> =
                await usersController.getReadUsers(readReq);

            const expectedResArr: TResponse[] = [];
            const reqArr: UserDeleteDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const currentPassword = createReqArr[index].user.password;
                    const deleteDto: UserDeleteDTO = new UserDeleteDTO();
                    deleteDto.userUUID =
                        readRes.payload?.[index].userUUID || '';
                    deleteDto.currentPassword = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => currentPassword,
                        () =>
                            randomString(
                                password.maxLength,
                                password.minLength,
                            ),
                    );

                    let expectedRes: TResponse;
                    if (deleteDto.currentPassword === currentPassword) {
                        expectedRes = resService.getSuccessRes('DELETE', {
                            UUID: deleteDto.userUUID,
                        });
                    } else {
                        expectedRes = resService.getWarnRes(
                            'DELETE',
                            'INCORRECT_PASSWORD',
                        );
                    }
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            const resArr: TResponse[] = [];
            for (const dto of reqArr) {
                const res: TResponse = await usersController.deleteUser(dto);
                resArr.push(res);
            }

            expect(resArr).toStrictEqual(expectedResArr);
        },
        HOOK_TIMEOUT,
    );
});
