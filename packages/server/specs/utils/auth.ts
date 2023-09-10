import request, { Response } from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { TSignInData, TSignInRes } from 'shared/types/auth';
import { Res } from 'shared/types/requestResponse';
import { IUser, IUserPublicData } from 'shared/types/user';

import { MIME_TYPE } from 'shared/static/web';

import { insertUsers } from './users';

import { IUserService } from 'services/user.service';

import { UserCreateDTO } from 'modules/user/models/dtos/userCreate.dto';

type TSignInUsers = (
    app: INestApplication,
    misc?: TMisc,
) => Promise<[Res<TSignInRes>[], Res<TSignInRes>[]]>;

type TMisc = {
    getStatus?: (index: number) => HttpStatus;
    mapResBody?: (resBody: Res<TSignInRes>) => Res<TSignInRes>;
    reqArr?: TSignInData[];
};
const miscFallback: Required<Omit<TMisc, 'reqArr'>> = {
    getStatus: () => HttpStatus.CREATED,
    mapResBody: (body) => body,
};

const requireSignInUsers =
    (userDataArr: IUser[], usersService: IUserService): TSignInUsers =>
    async (app, misc) => {
        const { getStatus, mapResBody, reqArr } = {
            ...miscFallback,
            ...misc,
        };

        let reqArrSafe: TSignInData[];
        const expectedResArr: Res<TSignInRes>[] = [];

        if (!reqArr) {
            const [usersCreateDTOArr, usersReadArr]: [
                UserCreateDTO[],
                Res<IUserPublicData[]>,
            ] = await insertUsers(userDataArr, usersService);

            const usersArr: IUserPublicData[] | null = usersReadArr.payload;
            reqArrSafe = (usersArr || []).map(
                (user: IUserPublicData, index: number): TSignInData => {
                    const expectedRes: Res<TSignInRes> = {
                        message: `Successfully sign in users, username '${user.username}'`,
                        payload: { user, accessToken: '', refreshToken: '' },
                    };
                    expectedResArr.push(expectedRes);
                    return {
                        username: user.username,
                        password: usersCreateDTOArr[index].user.password,
                    };
                },
            );
        } else reqArrSafe = reqArr ?? [];

        const resArr: Res<TSignInRes>[] = [];
        for (const [resIndex, dto] of reqArrSafe.entries()) {
            const res: Response = await request(app.getHttpServer())
                .post('/auth/signin')
                .set('Accepts', MIME_TYPE.applicationJson)
                .send(dto);

            if (res.statusCode !== getStatus(resIndex))
                console.info(`Sign in request:`, dto);
            expect(res.statusCode).toEqual(getStatus(resIndex));

            const resBodyMapped: Res<TSignInRes> = mapResBody(res.body);
            resArr.push(resBodyMapped);
        }
        return [resArr, expectedResArr];
    };

export type { TSignInUsers };
export { requireSignInUsers };
