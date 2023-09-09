import { HttpStatus, INestApplication, ValidationError } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { DataSource } from 'typeorm';
import request, { Response } from 'supertest';

import { IUser, IUserCreateData, IUserPublicData } from 'shared/types/user';
import { Res } from 'shared/types/requestResponse';
import { MIME_TYPE } from 'shared/static/web';
import { getQuery } from 'shared/utils/getQuery.util';
import {
    random,
    randomizeAction,
    randomRange,
    randomString,
} from 'shared/utils/random.util';

import { initApp } from './utils/initApp';
import { initializeDataSource, truncateTable } from './utils/dataSource';
import { createUsers, createUsersCreateDTO, insertUsers } from './utils/users';

import {
    ACTION_RANDOM_PERCENT,
    DATA_AMOUNT,
    HOOK_TIMEOUT,
} from './static/globals';
import { USERS_SCHEMA } from 'static/format';

import { User } from 'modules/user/models/entities/user.entity';
import { UserDTO } from 'modules/user/models/dtos/user.dto';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';
import { UsersReadDTO } from 'modules/user/models/dtos/usersRead.dto';
import { UserUpdateDTO } from 'modules/user/models/dtos/userUpdate.dto';
import { UserDeleteDTO } from 'modules/user/models/dtos/userDelete.dto';
import { IUsersService, UsersService } from 'services/users.service';

const userDataArr: IUser[] = createUsers();
const CREATE_ROUTE = '/users/create';
const UPDATE_ROUTE = '/users/update';
const DELETE_ROUTE = '/users/delete';

describe('Users module tests.', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let usersService: IUsersService;

    ///--- Prepare ---///

    beforeAll(async () => {
        const [initializedApp, moduleRef] = await initApp();
        app = initializedApp;
        dataSource = moduleRef.get<DataSource>(DataSource);
        usersService = moduleRef.get<IUsersService>(UsersService);
        await initializeDataSource(dataSource);
    }, HOOK_TIMEOUT);
    afterEach(async () => await truncateTable(dataSource, User), HOOK_TIMEOUT);
    afterAll(async () => await dataSource.destroy(), HOOK_TIMEOUT);

    ///--- Cases ---///

    ///--- UserDTO ---///
    it(
        'Should prevent create UserDTOs with incorrect length of props',
        async () => {
            const keys: (keyof UserDTO)[] = ['password', 'imgUrl', 'username'];
            const reqArr: UserDTO[] = [];
            const expectedResArr: number[] = [];

            userDataArr.forEach(({ userId: _, ...userDto }) => {
                const keyIndex: number = random(keys.length - 1);
                const key = keys[keyIndex];
                const schemaKey = USERS_SCHEMA[key];

                const value = randomString(schemaKey.maxLength, 0, true);
                const changedUserDto = { ...userDto, [key]: value };

                const isCorrect: boolean =
                    schemaKey?.length <= schemaKey?.maxLength &&
                    changedUserDto[key]?.length >=
                        (schemaKey?.minLength ?? 0) &&
                    (schemaKey?.regex ?? /.*/).test(changedUserDto[key]);

                expectedResArr.push(Number(!isCorrect));
                reqArr.push(plainToInstance(UserDTO, userDto));
            });

            for (const [index, dto] of reqArr.entries()) {
                const errors: ValidationError[] = await validate(dto);
                const expectedRes: number = expectedResArr[index];

                if (expectedRes) {
                    if (errors.length < expectedRes)
                        console.info('Validation errors:', errors);
                    expect(errors.length).toBeGreaterThanOrEqual(expectedRes);
                } else expect(errors.length).toStrictEqual(expectedRes);
            }
        },
        HOOK_TIMEOUT,
    );

    ///--- /POST CREATE ---///
    it(
        '/POST CREATE: should successfully create a new users',
        async () => {
            const expectedResArr: Res[] = [];
            const reqArr: UserCreateDTO[] = createUsersCreateDTO(userDataArr);

            reqArr.forEach((dto: UserCreateDTO) => {
                const expectedRes: Res = {
                    message: `Successfully create users: username '${dto.user.username}'`,
                    payload: null,
                };
                expectedResArr.push(expectedRes);
            });

            for (const [resIndex, dto] of reqArr.entries()) {
                const res: Response = await request(app.getHttpServer())
                    .post(CREATE_ROUTE)
                    .set('Content-type', MIME_TYPE.applicationJson)
                    .set('Accepts', MIME_TYPE.applicationJson)
                    .send(dto);

                if (res.statusCode !== HttpStatus.CREATED)
                    console.info(`Read request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    ///--- /GET READ ---///
    it(
        '/GET READ: should successfully get users with similar usernames OR by range',
        async () => {
            const reqArr: UsersReadDTO[] = [];
            const expectedResArr: Res<IUserPublicData[]>[] = [];

            const createReqArr: UserCreateDTO[] =
                createUsersCreateDTO(userDataArr);
            createReqArr.forEach((dto: UserCreateDTO) => {
                const user: IUserCreateData = dto.user;
                const readDto: UsersReadDTO = new UsersReadDTO();
                let readUsers: IUser[] = [];
                randomizeAction(
                    ACTION_RANDOM_PERCENT,
                    () => {
                        const [startId, endId] = randomRange(
                            user.username.length,
                        );
                        readDto.username = user.username.slice(startId, endId);
                        readUsers = readDto?.username.length
                            ? userDataArr.filter((u: IUser) =>
                                  u.username.includes(readDto?.username || ''),
                              )
                            : [];
                    },
                    () => {
                        const [startId, endId] = randomRange(DATA_AMOUNT, 1);
                        readDto.startId = startId;
                        readDto.endId = endId;
                        readUsers = userDataArr.slice(startId - 1, endId);
                    },
                );
                const expectedResPayload: IUserPublicData[] = readUsers.map(
                    (u: IUser): IUserPublicData => {
                        const { userId: _, password: __, ...rest } = u;
                        return { ...rest, userUUID: '' };
                    },
                );
                let expectedRes: Res<IUserPublicData[]>;
                if (expectedResPayload.length) {
                    expectedRes = {
                        message: `Successfully read users: amount '${expectedResPayload.length}'`,
                        payload: expectedResPayload,
                    };
                } else {
                    expectedRes = {
                        message: `Error read users: no users found!`,
                        payload: null,
                    };
                }

                expectedResArr.push(expectedRes);
                reqArr.push(readDto);
            });

            for (const dto of createReqArr) {
                await request(app.getHttpServer())
                    .post(CREATE_ROUTE)
                    .send(dto)
                    .expect(HttpStatus.CREATED);
            }
            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = expectedResArr[resIndex]
                    .payload?.length
                    ? HttpStatus.OK
                    : HttpStatus.NOT_FOUND;

                const res: Response = await request(app.getHttpServer())
                    .get('/users/read')
                    .query(getQuery(dto));
                if (res.statusCode !== expectedStatus)
                    console.info(`Read request:`, dto);

                const payloadMapped: IUserPublicData[] | null =
                    res.body.payload?.map(
                        (p: IUserPublicData): IUserPublicData => ({
                            ...p,
                            userUUID: '',
                        }),
                    ) || null;
                const resMapped: Res<IUserPublicData[]> = {
                    message: res.body.message,
                    payload: payloadMapped,
                };
                expect(resMapped).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    it(
        '/GET READ: should get 404 status because of no exist usernames NOR ids',
        async () => {
            const reqArr: UsersReadDTO[] = [];
            const expectedResArr: Res<IUserPublicData[]>[] = [];

            const createReqArr: UserCreateDTO[] = userDataArr.map(
                (dto: IUser): UserCreateDTO => {
                    const { userUUID: _, userId: __, ...rest } = dto;
                    const readDto: UsersReadDTO = new UsersReadDTO();
                    randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => {
                            readDto.username = randomString(
                                USERS_SCHEMA.username.maxLength,
                                USERS_SCHEMA.username.maxLength,
                            );
                        },
                        () => {
                            readDto.startId = DATA_AMOUNT + 1;
                            readDto.endId = DATA_AMOUNT * 2;
                        },
                    );
                    const expectedRes: Res<IUserPublicData[]> = {
                        message: `Error read users: no users found!`,
                        payload: null,
                    };

                    expectedResArr.push(expectedRes);
                    reqArr.push(readDto);
                    return {
                        user: { ...rest, passwordConfirm: rest.password },
                    };
                },
            );

            for (const dto of createReqArr) {
                const res: Response = await request(app.getHttpServer())
                    .post(CREATE_ROUTE)
                    .send(dto);

                if (res.statusCode !== HttpStatus.CREATED)
                    console.info(`Read request:`, dto);
                expect(res.statusCode).toEqual(HttpStatus.CREATED);
            }

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = HttpStatus.NOT_FOUND;
                const res: Response = await request(app.getHttpServer())
                    .get('/users/read')
                    .query(getQuery(dto));

                if (res.statusCode !== expectedStatus)
                    console.info(`Read request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    ///--- /PUT UPDATE ---///
    it(
        '/PUT UPDATE: should successfully update users info',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res<IUserPublicData>[] = [];
            const reqArr: UserUpdateDTO[] = (readRes.payload || []).map(
                (u: IUserPublicData, index: number) => {
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
                        imgUrl: randomString(USERS_SCHEMA.imgUrl.maxLength),
                    };

                    const updatedUser: IUser = new User();
                    updatedUser.userUUID = u.userUUID;
                    updatedUser.username = updateDto.user?.username || '';
                    updatedUser.imgUrl = updateDto.user?.imgUrl || '';
                    const {
                        userId: _,
                        password: __,
                        ...updatedUserPublic
                    } = updatedUser;
                    const expectedRes: Res<IUserPublicData> = {
                        message: `Successfully update users: uuid '${updatedUser.userUUID}'`,
                        payload: updatedUserPublic,
                    };
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = HttpStatus.OK;
                const res: Response = await request(app.getHttpServer())
                    .put(UPDATE_ROUTE)
                    .send(dto);

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    it(
        '/PUT UPDATE: should prevent update users with incorrect UUID',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res<IUserPublicData>[] = [];
            const reqArr: UserUpdateDTO[] = (readRes.payload || []).map(
                (u: IUserPublicData, index: number) => {
                    const updateUserPassword: string = randomString(
                        USERS_SCHEMA.password.maxLength,
                        USERS_SCHEMA.password.minLength,
                    );
                    const updateDto: UserUpdateDTO = new UserUpdateDTO();
                    updateDto.user = {
                        userUUID: randomizeAction(
                            ACTION_RANDOM_PERCENT,
                            () => u.userUUID,
                            () =>
                                randomString(
                                    USERS_SCHEMA.uuid.maxLength,
                                    USERS_SCHEMA.uuid.maxLength,
                                ),
                        ),
                        username: randomString(
                            USERS_SCHEMA.username.maxLength,
                            USERS_SCHEMA.username.minLength,
                        ),
                        password: updateUserPassword,
                        passwordConfirm: updateUserPassword,
                        currentPassword: createReqArr[index].user.password,
                        imgUrl: randomString(USERS_SCHEMA.imgUrl.maxLength),
                    };

                    const updatedUser: IUser = new User();
                    updatedUser.userUUID = updateDto.user.userUUID;
                    updatedUser.username = updateDto.user?.username || '';
                    updatedUser.imgUrl = updateDto.user?.imgUrl || '';
                    const {
                        userId: _,
                        password: __,
                        ...updatedUserPublic
                    } = updatedUser;
                    let expectedRes: Res<IUserPublicData>;
                    if (updateDto.user.userUUID === u.userUUID) {
                        expectedRes = {
                            message: `Successfully update users: uuid '${updatedUser.userUUID}'`,
                            payload: updatedUserPublic,
                        };
                    } else {
                        expectedRes = {
                            message: `Error update users: no users found, uuid '${updatedUser.userUUID}'!`,
                            payload: null,
                        };
                    }
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = expectedResArr[resIndex]
                    .payload
                    ? HttpStatus.OK
                    : HttpStatus.NOT_FOUND;

                const res: Response = await request(app.getHttpServer())
                    .put(UPDATE_ROUTE)
                    .send(dto);

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    it(
        '/PUT UPDATE: should reject update users with incorrect current password confirmation',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res<IUserPublicData>[] = [];
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
                        imgUrl: randomString(USERS_SCHEMA.imgUrl.maxLength),
                    };

                    let expectedRes: Res<IUserPublicData>;
                    if (updateDto.user.currentPassword === currentPassword) {
                        const updatedUser: IUser = new User();
                        updatedUser.userUUID = u.userUUID;
                        updatedUser.username = updateDto.user?.username || '';
                        updatedUser.imgUrl = updateDto.user?.imgUrl || '';
                        const {
                            userId: _,
                            password: __,
                            ...updatedUserPublic
                        } = updatedUser;

                        expectedRes = {
                            message: `Successfully update users: uuid '${updatedUser.userUUID}'`,
                            payload: updatedUserPublic,
                        };
                    } else {
                        expectedRes = {
                            message: `Error update users: passwords don't match, uuid '${u.userUUID}'!`,
                            payload: null,
                        };
                    }
                    expectedResArr.push(expectedRes);
                    return updateDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = expectedResArr[resIndex]
                    .payload
                    ? HttpStatus.OK
                    : HttpStatus.UNAUTHORIZED;

                const res: Response = await request(app.getHttpServer())
                    .put(UPDATE_ROUTE)
                    .send(dto);

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    ///--- /DELETE ---///
    it(
        '/DELETE: should successfully delete users',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res[] = [];
            const reqArr: UserDeleteDTO[] = (readRes.payload || []).map(
                (u: IUserPublicData, index: number) => {
                    const deleteDto: UserDeleteDTO = new UserDeleteDTO();
                    deleteDto.userUUID = u.userUUID;
                    deleteDto.currentPassword =
                        createReqArr[index].user.password;

                    const expectedRes: Res = {
                        message: `Successfully delete users: uuid '${deleteDto.userUUID}'`,
                        payload: null,
                    };
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = HttpStatus.OK;
                const res: Response = await request(app.getHttpServer())
                    .delete(DELETE_ROUTE)
                    .query(getQuery(dto));

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    it(
        '/DELETE: should prevent delete users with incorrect UUID',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res[] = [];
            const reqArr: UserDeleteDTO[] = (readRes.payload || []).map(
                (u, index) => {
                    const deleteDto: UserDeleteDTO = new UserDeleteDTO();
                    deleteDto.userUUID = randomizeAction(
                        ACTION_RANDOM_PERCENT,
                        () => u.userUUID,
                        () =>
                            randomString(
                                USERS_SCHEMA.uuid.maxLength,
                                USERS_SCHEMA.uuid.maxLength,
                            ),
                    );
                    deleteDto.currentPassword =
                        createReqArr[index].user.password;

                    let expectedRes: Res;
                    if (deleteDto.userUUID === u.userUUID) {
                        expectedRes = {
                            message: `Successfully delete users: uuid '${deleteDto.userUUID}'`,
                            payload: null,
                        };
                    } else {
                        expectedRes = {
                            message: `Error delete users: no users found, uuid '${deleteDto.userUUID}'!`,
                            payload: null,
                        };
                    }
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = /no users found/.test(
                    expectedResArr[resIndex].message,
                )
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.OK;

                const res: Response = await request(app.getHttpServer())
                    .delete(DELETE_ROUTE)
                    .query(getQuery(dto));

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );

    it(
        '/DELETE: should prevent delete users with incorrect password confirmation',
        async () => {
            const [createReqArr, readRes]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const expectedResArr: Res[] = [];
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
                                USERS_SCHEMA.password.maxLength,
                                USERS_SCHEMA.password.minLength,
                            ),
                    );

                    let expectedRes: Res;
                    if (deleteDto.currentPassword === currentPassword) {
                        expectedRes = {
                            message: `Successfully delete users: uuid '${deleteDto.userUUID}'`,
                            payload: null,
                        };
                    } else {
                        expectedRes = {
                            message: `Error delete users: passwords don't match, uuid '${deleteDto.userUUID}'!`,
                            payload: null,
                        };
                    }
                    expectedResArr.push(expectedRes);
                    return deleteDto;
                },
            );

            for (const [resIndex, dto] of reqArr.entries()) {
                const expectedStatus: HttpStatus = /passwords don't match/.test(
                    expectedResArr[resIndex].message,
                )
                    ? HttpStatus.UNAUTHORIZED
                    : HttpStatus.OK;

                const res: Response = await request(app.getHttpServer())
                    .delete(DELETE_ROUTE)
                    .query(getQuery(dto));

                if (res.statusCode !== expectedStatus)
                    console.info(`Update request:`, dto);
                expect(res.body).toStrictEqual(expectedResArr[resIndex]);
            }
        },
        HOOK_TIMEOUT,
    );
});
