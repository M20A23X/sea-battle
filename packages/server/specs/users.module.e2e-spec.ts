import { v4 } from 'uuid';
import request, { Response } from 'supertest';
import { HttpStatus, INestApplication, ValidationError } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { TestRes } from 'shared/types/specs';

import { getQuery } from 'shared/utils/requestResponse.util';
import {
    random,
    RandomAction,
    randomizeAction,
    randomRange
} from 'shared/utils/random.util';

import { MIME_TYPE } from 'shared/static/web';
import { DATA_AMOUNT, HOOK_TIMEOUT } from 'shared/static/specs';

import {
    UserDeleteData,
    UserUpdateData,
    IUser,
    UserCreateData,
    UserPublicData,
    UsersReadData
} from 'shared/types/user';

import { initApp } from './utils/initApp';
import { initializeDataSource, truncateTable } from './utils/dataSource';
import {
    createUserCreateDTOs,
    CreateUsers,
    expandRegex,
    requireCreateUsers,
    USER_TEST_DATA
} from './utils/users';

import { IUserService, UserService } from 'services/user.service';

import { USER_ENTITY, USERS_SCHEMA } from 'static/format';

import { User } from 'modules/user/models/entities/user.entity';
import { UserDTO } from 'modules/user/models/dtos/user.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';

const {
    username: USERNAME,
    password: PASSWORD,
    imgPath: IMG_URL
} = USERS_SCHEMA;

const [createDTOsRaw, exCreateRes]: [UserCreateDTO[], TestRes[]] =
    createUserCreateDTOs();
const CREATE_ROUTE = '/users/create';
const UPDATE_ROUTE = '/users/update';
const DELETE_ROUTE = '/users/delete';

describe('Users module tests.', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let createUsers: CreateUsers;

    ///--- Prepare ---///

    beforeAll(async () => {
        const [moduleRef, initializedApp] = await initApp();
        app = initializedApp;
        dataSource = moduleRef.get<DataSource>(DataSource);
        createUsers = requireCreateUsers(
            moduleRef.get<IUserService>(UserService)
        );
        await initializeDataSource(dataSource);
    }, HOOK_TIMEOUT);
    afterEach(async () => await truncateTable(dataSource, User), HOOK_TIMEOUT);
    afterAll(async () => await dataSource.destroy(), HOOK_TIMEOUT);

    ///--- Cases ---///

    ///--- UserDTO ---///
    it(
        'Should prevent create UserDTOs with incorrect props format',
        async () => {
            const [randomValue] = expandRegex(/^(\W){100}$/, 1);
            const createActions: RandomAction<UserDTO, [UserDTO, number]>[] = [
                (userDTORaw: UserDTO) => {
                    const userDTO: UserDTO = {
                        ...userDTORaw,
                        userUUID: randomValue,
                        username: randomValue,
                        password: randomValue,
                        imgPath: randomValue,
                        currentPassword: randomValue,
                        passwordConfirm: randomValue,
                        startId: -2,
                        endId: -1
                    };
                    return [userDTO, 7];
                },
                (userDTORaw: UserDTO) => {
                    const userDTO: UserDTO = {
                        ...userDTORaw,
                        password: userDTORaw.password,
                        passwordConfirm: expandRegex(PASSWORD.regex, 1)[0]
                    };
                    return [userDTO, 1];
                },
                (userDTORaw: UserDTO) => {
                    const userDTO: UserDTO = {
                        ...userDTORaw,
                        startId: 2,
                        endId: 1
                    };
                    return [userDTO, 1];
                },
                (userDTORaw: UserDTO) => [userDTORaw, 0]
            ];

            const exErrorsAmounts: number[] = [];
            const userDTOs: UserDTO[] = USER_TEST_DATA.username.map(
                (username: string, index: number): UserDTO => {
                    const password: string = USER_TEST_DATA.password[index];
                    const startId: number = random(100, 1);
                    const userDTORaw: UserDTO = {
                        userUUID: v4(),
                        username,
                        password,
                        imgPath: USER_TEST_DATA.imgPath[index],
                        startId,
                        endId: random(100, startId),
                        currentPassword: password,
                        passwordConfirm: password
                    };

                    const [userDTO, exErrorsAmount] = randomizeAction(
                        createActions,
                        [userDTORaw]
                    );
                    exErrorsAmounts.push(exErrorsAmount);
                    return plainToInstance(UserDTO, userDTO);
                }
            );

            for (const [index, dto] of userDTOs.entries()) {
                const exErrorsAmount: number = exErrorsAmounts[index];
                const errors: ValidationError[] = await validate(dto);
                if (errors.length !== exErrorsAmount) {
                    console.info('Expected errors amount: ', exErrorsAmount);
                    console.info('Errors: ', errors);
                }
                expect(errors.length).toEqual(exErrorsAmount);
            }
        },
        HOOK_TIMEOUT
    );

    ///--- /POST CREATE ---///
    it(
        '/POST CREATE users: should create/prevent create users with same username',
        async () => {
            const createActions: RandomAction<
                number,
                [UserCreateDTO, TestRes]
            >[] = [
                (index: number) => {
                    if (!index)
                        return [createDTOsRaw[index], exCreateRes[index]];

                    const duplicatedUsername: string =
                        createDTOsRaw[0].user.username;
                    const createDTO: UserCreateData = {
                        ...createDTOsRaw[index].user,
                        username: duplicatedUsername
                    };
                    const exResp: TestRes = {
                        message: `Error create users: user already exists, username '${duplicatedUsername}'!`,
                        status: HttpStatus.CONFLICT
                    };
                    return [{ user: createDTO }, exResp];
                },
                (index: number) => [createDTOsRaw[index], exCreateRes[index]]
            ];

            const exRes: TestRes[] = [];
            const createDTOs: UserCreateDTO[] = createDTOsRaw.map(
                (_, index: number): UserCreateDTO => {
                    const [createDTO, exResp] = randomizeAction<
                        number,
                        [UserCreateDTO, TestRes]
                    >(createActions, [index]);
                    exRes.push(exResp);
                    return createDTO;
                }
            );

            for (const [index, dto] of createDTOs.entries()) {
                const exResp: TestRes = exRes[index];
                const res: Response = await request(app.getHttpServer())
                    .post(CREATE_ROUTE)
                    .set('Content-type', MIME_TYPE.applicationJson)
                    .set('Accepts', MIME_TYPE.applicationJson)
                    .send(dto);

                if (res.statusCode !== exResp.status) {
                    console.info(`Create request:`, dto);
                    console.info(`Create response:`, res.body);
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        HOOK_TIMEOUT
    );

    ///--- /GET READ ---///
    it(
        '/GET READ users: should get with similar usernames OR by range/prevent get for non existent',
        async () => {
            type ActionReturn = [UsersReadData, UserPublicData[]];
            const readActions: RandomAction<UserPublicData, ActionReturn>[] = [
                (user: UserPublicData) => {
                    const [startId, endId] = randomRange(
                        USER_ENTITY.username.maxLength,
                        0
                    );
                    const searchUsername: string =
                        user.username.length >= endId - startId &&
                        endId - startId >= USER_ENTITY.username.minLength
                            ? user.username.slice(startId, endId)
                            : user.username;
                    const readUsers: UserPublicData[] = users.filter(
                        (u: UserPublicData) =>
                            u.username.includes(searchUsername)
                    );
                    const readDTO: UsersReadData = { username: searchUsername };
                    return [readDTO, readUsers];
                },
                () => {
                    const [randomUsername] = expandRegex(USERNAME.regex, 1);
                    const readDTO: UsersReadData = { username: randomUsername };
                    return [readDTO, []];
                },
                () => {
                    const [startId, endId] = randomRange(
                        2 * DATA_AMOUNT,
                        DATA_AMOUNT + 1
                    );
                    const readDTO: UsersReadData = { startId, endId };
                    return [readDTO, []];
                }
            ];

            const users: UserPublicData[] = await createUsers(
                createDTOsRaw,
                false
            );
            const exRes: TestRes<UserPublicData[] | void>[] = [];
            const readDTOs: UsersReadData[] = users.map(
                (user: UserPublicData): UsersReadData => {
                    const [readDTO, readUsers] = randomizeAction<
                        UserPublicData,
                        ActionReturn
                    >(readActions, [user]);

                    let exResp: TestRes<UserPublicData[] | void>;
                    if (readUsers.length) {
                        exResp = {
                            message: `Successfully read users, amount '${readUsers.length}'`,
                            payload: readUsers,
                            status: HttpStatus.OK
                        };
                    } else {
                        const qualifier: string | undefined =
                            readDTO.userUUID ?? readDTO.username;
                        const qualifierPayload = qualifier
                            ? `, qualifier '${qualifier}'`
                            : '';
                        exResp = {
                            message: `Error read users: no users found${qualifierPayload}!`,
                            status: HttpStatus.NOT_FOUND
                        };
                    }

                    exRes.push(exResp);
                    return readDTO;
                }
            );

            for (const [index, dto] of readDTOs.entries()) {
                const exResp: TestRes<UserPublicData | void> = exRes[index];
                const res: Response = await request(app.getHttpServer())
                    .get('/users/read')
                    .query(getQuery(dto));

                if (res.statusCode !== exResp.status) {
                    console.info(`Read request:`, dto);
                    console.info(`Read response:`, res.body);
                }

                if (exResp?.['payload']) {
                    const resPayload: UserPublicData[] | undefined = res.body
                        ?.payload as UserPublicData[];
                    expect(resPayload !== undefined).toEqual(true);

                    resPayload.forEach(({ userUUID }: UserPublicData): void => {
                        expect(USERS_SCHEMA.uuid.regex.test(userUUID)).toEqual(
                            true
                        );
                    });
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        HOOK_TIMEOUT
    );

    ///--- /PUT UPDATE ---///
    it(
        '/PUT UPDATE users: should update/prevent update with incorrect UUID/password confirmation',
        async () => {
            type ActionArgs = { updateDTORaw: UserUpdateDTO; user: IUser };
            type ActionReturn = [UserUpdateDTO, TestRes<UserPublicData | void>];
            const updateActions: RandomAction<ActionArgs, ActionReturn>[] = [
                ({ updateDTORaw: { user: updateUserData }, user }) => {
                    const updateUserEntries: [string, IUser[keyof IUser]][] =
                        Object.entries(user).map(([key, value]) => [
                            key,
                            updateUserData[key] ? updateUserData[key] : value
                        ]);

                    const {
                        userId: _,
                        password: __,
                        ...userPublicData
                    } = Object.fromEntries(updateUserEntries) as any as IUser;

                    const exResp: TestRes<UserPublicData> = {
                        message: `Successfully update users, uuid '${user.userUUID}'`,
                        payload: userPublicData,
                        status: HttpStatus.OK
                    };
                    return [{ user: { ...updateUserData } }, exResp];
                },
                ({ updateDTORaw: { user } }) => {
                    const updateDTO: UserUpdateData = {
                        userUUID: user.userUUID,
                        currentPassword: expandRegex(PASSWORD.regex, 1)[0]
                    };
                    const exResp: TestRes = {
                        message: `Error update users: passwords don't match, uuid '${updateDTO.userUUID}'!`,
                        status: HttpStatus.UNAUTHORIZED
                    };
                    return [{ user: updateDTO }, exResp];
                },
                ({ updateDTORaw: { user } }) => {
                    const updateDTO: UserUpdateData = {
                        userUUID: v4(),
                        currentPassword: user.currentPassword
                    };
                    const exResp: TestRes = {
                        message: `Error read users: no users found, qualifier '${updateDTO.userUUID}'!`,
                        status: HttpStatus.NOT_FOUND
                    };
                    return [{ user: updateDTO }, exResp];
                }
            ];

            const users: IUser[] = await createUsers(createDTOsRaw, true);
            const updateDTOsRaw: UserUpdateDTO[] = users.map((user: IUser) => {
                const [password] = expandRegex(PASSWORD.regex, 1);
                return {
                    user: {
                        userUUID: user.userUUID,
                        username: expandRegex(USERNAME.regex, 1)[0],
                        password,
                        passwordConfirm: password,
                        currentPassword: user.password,
                        imgPath: expandRegex(IMG_URL.regex, 1)[0]
                    }
                };
            });

            const exRes: TestRes<IUser | void>[] = [];
            const updateDTOs: UserUpdateDTO[] = updateDTOsRaw.map(
                (updateDTORaw: UserUpdateDTO, index: number): UserUpdateDTO => {
                    const [updateDTO, exResp] = randomizeAction<
                        ActionArgs,
                        ActionReturn
                    >(updateActions, [{ updateDTORaw, user: users[index] }]);

                    exRes.push(exResp);
                    return updateDTO;
                }
            );

            for (const [index, dto] of updateDTOs.entries()) {
                const exResp: TestRes<UserPublicData | void> = exRes[index];
                const res: Response = await request(app.getHttpServer())
                    .put(UPDATE_ROUTE)
                    .send(dto);

                if (res.statusCode !== exResp.status) {
                    console.info(`Update request:`, dto);
                    console.info(`Update response:`, res.body);
                }
                if (exResp?.['payload']) {
                    const exPayload = exResp?.['payload'] as UserPublicData;
                    expect(res.body?.payload).toStrictEqual(exPayload);
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        HOOK_TIMEOUT
    );

    ///--- /DELETE ---///
    it(
        '/DELETE users: should delete/prevent delete with incorrect UUID/password confirmation',
        async () => {
            type ActionReturn = [UserDeleteData, TestRes];
            const deleteActions: RandomAction<UserDeleteData, ActionReturn>[] =
                [
                    (deleteData: UserDeleteData) => {
                        const deleteDTO: UserDeleteData = {
                            userUUID: deleteData.userUUID,
                            currentPassword: deleteData.currentPassword
                        };
                        const exResp: TestRes = {
                            message: `Successfully delete users, uuid '${deleteDTO.userUUID}'`,
                            status: HttpStatus.OK
                        };
                        return [deleteDTO, exResp];
                    },
                    (deleteData: UserDeleteData) => {
                        const randomUUID: string = v4();
                        const deleteDTO: UserDeleteData = {
                            userUUID: randomUUID,
                            currentPassword: deleteData.currentPassword
                        };
                        const exResp: TestRes = {
                            message: `Error read users: no users found, qualifier '${randomUUID}'!`,
                            status: HttpStatus.NOT_FOUND
                        };
                        return [deleteDTO, exResp];
                    },
                    (deleteData: UserDeleteData) => {
                        const deleteDTO: UserDeleteData = {
                            userUUID: deleteData.userUUID,
                            currentPassword: expandRegex(PASSWORD.regex, 1)[0]
                        };
                        const exResp: TestRes = {
                            message: `Error delete users: passwords don't match, uuid '${deleteDTO.userUUID}'!`,
                            status: HttpStatus.UNAUTHORIZED
                        };
                        return [deleteDTO, exResp];
                    }
                ];

            const users: IUser[] = await createUsers(createDTOsRaw, true);
            const deleteDTOsRaw: UserDeleteDTO[] = users.map(
                (user: IUser): UserDeleteDTO => ({
                    user: {
                        userUUID: user.userUUID,
                        currentPassword: user.password
                    }
                })
            );

            const exRes: TestRes[] = [];
            const deleteDTOs: UserDeleteDTO[] = deleteDTOsRaw.map(
                (deleteDTORaw: UserDeleteDTO) => {
                    const [deleteDTO, exResp] = randomizeAction<
                        UserDeleteData,
                        ActionReturn
                    >(deleteActions, [deleteDTORaw.user]);

                    exRes.push(exResp);
                    return { user: deleteDTO };
                }
            );

            for (const [index, dto] of deleteDTOs.entries()) {
                const exResp: TestRes = exRes[index];
                const res: Response = await request(app.getHttpServer())
                    .delete(DELETE_ROUTE)
                    .send(dto);

                if (res.statusCode !== exResp.status) {
                    console.info(`Delete request:`, dto);
                    console.info(`Delete response:`, res.body);
                }
                expect(res.body?.message).toStrictEqual(exResp.message);
                expect(res.statusCode).toEqual(exResp.status);
            }
        },
        HOOK_TIMEOUT
    );
});
