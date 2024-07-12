type ResMessage = { message: string };
type ResPayload<P> = { payload: P };

enum MimeType {
    ApplicationJson = 'application/json',
    MultipartFormData = 'multipart/form-data'
}

type ResData<P = void> = P extends void
    ? ResMessage
    : ResMessage & ResPayload<P>;

type Req<K extends string, V = object> = {
    [key in K]: V | null;
};
type Res<P = void> = Promise<ResData<P>>;

export { MimeType, Req, Res, ResData };
