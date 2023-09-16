import { expandN } from 'regex-to-strings';
import { HttpStatus } from '@nestjs/common';

import { Res, TestData, TestRes, UserCreateData } from '#shared/types';

import { SPECS_DATA_AMOUNT } from '#shared/static';

import { UsersRead } from '#/types';

import { USERS_SCHEMA } from '#/static';

import { IUserService } from '#/services';
import { UserCreateDTO } from '#/modules/user';

type UserTestData = Omit<UserCreateData, 'passwordConfirm'>;
type CreateUsers = <T extends boolean>(
    createDTOs: UserCreateDTO[],
    requirePrivate: T
) => Promise<UsersRead<T>[]>;

const { username, password, imgPath } = USERS_SCHEMA;
const expandRegex = (regex: RegExp, amount: number): string[] =>
    expandN(regex, amount);

const USER_TEST_DATA: TestData<UserTestData> = {
    username: expandRegex(username.regex, SPECS_DATA_AMOUNT),
    password: expandRegex(password.regex, SPECS_DATA_AMOUNT),
    imgPath: expandRegex(imgPath.regex, SPECS_DATA_AMOUNT)
};

const createUserCreateDTOs = (): [UserCreateDTO[], TestRes[]] => {
    const exRes: TestRes[] = [];
    const reqs: UserCreateDTO[] = USER_TEST_DATA.username.map(
        (username: string, index: number): UserCreateDTO => {
            const exResp: TestRes = {
                message: `Successfully create users, username '${username}'`,
                status: HttpStatus.CREATED
            };
            exRes.push(exResp);
            const password: string = USER_TEST_DATA.password[index];
            return {
                user: {
                    username,
                    password,
                    passwordConfirm: password,
                    imgPath: USER_TEST_DATA.imgPath[index]
                }
            };
        }
    );
    return [reqs, exRes];
};

const requireCreateUsers =
    (usersService: IUserService): CreateUsers =>
    async <T extends boolean>(
        createDTOs: UserCreateDTO[],
        requirePrivate: T
    ): Promise<UsersRead<T>[]> => {
        for (const u of createDTOs) await usersService.createUser(u.user);
        const readRes: Res<UsersRead<T>[]> = await usersService.readUsers(
            { startId: 1, endId: SPECS_DATA_AMOUNT },
            requirePrivate
        );
        return readRes.payload.map((user: UsersRead<T>, index: number) =>
            requirePrivate
                ? { ...user, password: createDTOs[index].user.password }
                : user
        );
    };

export type { CreateUsers };
export { USER_TEST_DATA };
export { expandRegex, createUserCreateDTOs, requireCreateUsers };
