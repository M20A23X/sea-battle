import request, { Response } from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { MimeType, ResData } from '#shared/types/interfaces';

const req = (
    method: 'post' | 'get' | 'put' | 'delete',
    url: string,
    app: INestApplication,
    accessToken: string,
    origin: string,
    contentType: MimeType
): request.Test =>
    request(app.getHttpServer())
        [method](url)
        .set('Authorization', accessToken)
        .set('Content-type', contentType)
        .set('Accepts', MimeType.ApplicationJson)
        .set('Origin', origin);

const requireRunTest = (
    app: INestApplication,
    accessToken: string,
    origin: string
) => {
    return async <R extends object>(
        method: 'post' | 'get' | 'put' | 'delete',
        url: string,
        handler: (req: request.Test) => request.Test,
        status: HttpStatus,
        message: string,
        contentType: MimeType = MimeType.ApplicationJson,
        payload?: R
    ): Promise<void> => {
        const testReq: request.Test = req(
            method,
            url,
            app,
            accessToken,
            origin,
            contentType
        );
        const res: Response = await handler(testReq);

        const body = res.body as ResData<R>;
        expect(body.message).toEqual(message);
        if (payload) expect(body.payload).toEqual(payload);
        expect(res.statusCode).toEqual(status);
    };
};

export { req, requireRunTest };
