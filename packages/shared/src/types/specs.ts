import { HttpStatus } from '@nestjs/common';
import { Res } from './requestResponse';

type TestData<T> = { [K in keyof T]: string[] };
type TestRes<P = void> = Res<P> & { status: HttpStatus };

export type { TestData, TestRes };
