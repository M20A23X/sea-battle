export type TRequest<K extends string, V = object> = {
    [key in K]: V | null;
};

export type TResponse<P = void> = { message: string; payload: P | null };

export type TPromiseResponse<P = void> = Promise<TResponse<P>>;
