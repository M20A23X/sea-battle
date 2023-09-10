import { IUser, IUserPublicData } from 'shared/types/user';
import { Res } from 'shared/types/requestResponse';
import { randomString } from 'shared/utils/random.util';

import { DATA_AMOUNT } from '../static/globals';

import { USERS_SCHEMA } from 'static/format';

import { IUserService } from 'services/user.service';

import { User } from 'modules/user/models/entities/user.entity';
import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';

const { username, password, imgUrl } = USERS_SCHEMA;

const createUsers = (): IUser[] =>
    new Array(DATA_AMOUNT).fill(null).map(() => {
        const user: IUser = new User();
        user.userUUID = '';
        user.username = randomString(username.maxLength, username.minLength);
        user.password = randomString(password.maxLength, password.minLength);
        user.imgUrl = 'http://'.concat(randomString(imgUrl.maxLength));
        return user;
    });

const createUsersCreateDTO = (userDataArr: IUser[]): UserCreateDTO[] => {
    return userDataArr.map((u: IUser): UserCreateDTO => {
        const { userUUID: _, userId: __, ...rest } = u;
        return { user: { ...rest, passwordConfirm: rest.password } };
    });
};

const insertUsers = async (
    userDataArr: IUser[],
    usersService: IUserService,
): Promise<[UserCreateDTO[], Res<IUserPublicData[]>]> => {
    const createReqArr: UserCreateDTO[] = createUsersCreateDTO(userDataArr);
    for (const u of createReqArr) await usersService.createUser(u.user);

    const readRes: Res<IUserPublicData[]> = await usersService.readUsers(
        { startId: 1, endId: DATA_AMOUNT },
        false,
    );

    return [createReqArr, readRes];
};

export { createUsers, createUsersCreateDTO, insertUsers };
