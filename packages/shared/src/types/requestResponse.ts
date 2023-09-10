type ServiceCode =
    | 'NO_TOKEN'
    | 'NO_SESSION'
    | 'SESSION_EXPIRED'
    | 'IP_CHANGED'
    | 'NOT_FOUND'
    | 'NOT_PROVIDED'
    | 'BAD_REQUEST'
    | 'FORBIDDEN'
    | 'UNACCEPTABLE_EXT'
    | 'UNEXPECTED_DB_ERROR'
    | 'ER_DUP_ENTRY'
    | 'ER_NO_REFERENCED_ROW_2'
    | 'PASSWORDS_DONT_MATCH'
    | 'UNEXPECTED_ERROR';

type Operation =
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'UPLOAD'
    | 'DELETE'
    | 'CHECK'
    | 'SIGN_IN'
    | 'REFRESH';

type Req<K extends string, V = object> = {
    [key in K]: V | null;
};
type Res<P = void> = { message: string; payload: P | null };
type PromiseRes<P = void> = Promise<Res<P>>;

type ResPayload = object | string | undefined;

export type { ServiceCode, Operation, Req, Res, PromiseRes, ResPayload };
