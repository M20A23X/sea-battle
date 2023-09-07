type ServiceCode =
    | 'SUCCESS'
    | 'UNAUTHORIZED'
    | 'NOT_FOUND'
    | 'ER_DUP_ENTRY'
    | 'ER_NO_REFERENCED_ROW_2'
    | 'PASSWORDS_DONT_MATCH'
    | 'UNEXPECTED_ERROR';

type Operation =
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'CHECK'
    | 'SIGN_IN'
    | 'REFRESH';

type Req<K extends string, V = object> = {
    [key in K]: V | null;
};
type Res<P = void> = { message: string; payload: P | null };

type ServiceRes<P = void> = Res<P> & {
    isSuccess: boolean;
    serviceCode: ServiceCode;
    operation: Operation;
};
type ServicePromiseRes<P = void> = Promise<ServiceRes<P>>;
type ControllerRes<P = void> = Promise<Res<P> | object>;

export type {
    ServiceCode,
    Operation,
    Req,
    Res,
    ControllerRes,
    ServiceRes,
    ServicePromiseRes,
};
