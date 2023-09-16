import { IUser, UserPublicData } from '#shared/types';

type UsersRead<T> = T extends true ? IUser : UserPublicData;

export type { UsersRead };
