import { Res } from 'shared/types/requestResponse';

import { DATA_AMOUNT } from 'shared/static/specs';

import { expandN } from 'regex-to-strings';
import { TestData, TestRes } from 'shared/types/specs';
import { HttpStatus } from '@nestjs/common';
import { UserCreateData } from 'shared/types/user';

import { ReadType } from 'types/user';
import { USERS_SCHEMA } from 'static/format';

import { IUserService } from 'services/user.service';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';

type UserTestData = Omit<UserCreateData, 'passwordConfirm'>;
type CreateUsers = <T extends boolean>(
    createDTOs: UserCreateDTO[],
    requirePrivate: T
) => Promise<ReadType<T>[]>;

const { username, password, imgPath } = USERS_SCHEMA;
const expandRegex = (regex: RegExp, amount: number): string[] =>
    expandN(regex, amount);

const USER_TEST_DATA: TestData<UserTestData> = {
    username: expandRegex(username.regex, DATA_AMOUNT),
    password: expandRegex(password.regex, DATA_AMOUNT),
    imgPath: expandRegex(imgPath.regex, DATA_AMOUNT)
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
    ): Promise<ReadType<T>[]> => {
        for (const u of createDTOs) await usersService.createUser(u.user);
        const readRes: Res<ReadType<T>[]> = await usersService.readUsers(
            { startId: 1, endId: DATA_AMOUNT },
            requirePrivate
        );
        return readRes.payload.map((user: ReadType<T>, index: number) =>
            requirePrivate
                ? { ...user, password: createDTOs[index].user.password }
                : user
        );
    };

export type { CreateUsers };
export { USER_TEST_DATA };
export { expandRegex, createUserCreateDTOs, requireCreateUsers };
