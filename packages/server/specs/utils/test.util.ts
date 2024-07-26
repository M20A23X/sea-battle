import request, { Response } from 'supertest';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { MimeType, ResData } from '#shared/types/interfaces';

const req = <T extends object>(
    dto: T,
    method: 'post' | 'get' | 'put' | 'delete',
    url: string,
    app: INestApplication,
    accessToken: string,
    origin: string
): request.Test =>
    request(app.getHttpServer())
        [method](url)
        .set('Authorization', accessToken)
        .set('Content-type', MimeType.ApplicationJson)
        .set('Accepts', MimeType.ApplicationJson)
        .set('Origin', origin)
        .send(dto);

const requireRunTest = (
    app: INestApplication,
    accessToken: string,
    origin: string
) => {
    return async <T extends object, R extends object>(
        method: 'post' | 'get' | 'put' | 'delete',
        url: string,
        dto: T,
        status: HttpStatus,
        message: string,
        payload?: R
    ): Promise<void> => {
        const res: Response = await req(
            dto,
            method,
            url,
            app,
            accessToken,
            origin
        );
        const body = res.body as ResData<R>;
        expect(body.message).toEqual(message);
        if (payload) expect(body.payload).toEqual(payload);
        expect(res.statusCode).toEqual(status);
    };
};

export { req, requireRunTest };
