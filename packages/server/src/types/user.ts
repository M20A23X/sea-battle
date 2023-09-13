import { IUser, UserPublicData } from 'shared/types/user';

type ReadType<T> = T extends true ? IUser : UserPublicData;

export type { ReadType };
