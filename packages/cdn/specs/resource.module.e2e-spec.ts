import * as fs from 'fs';
import * as path from 'path';
import request, { Response } from 'supertest';
import {
    HttpStatus,
    INestApplication,
    LogLevel,
    ModuleMetadata,
    ValidationError,
    ValidationPipe
} from '@nestjs/common';
import { expandN } from 'regex-to-strings';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
    IAssetsConfig,
    IAuthConfig,
    IEnvConfig,
    IValidationConfig,
    NodeEnv,
    Resource,
    ServiceRes,
    UploadEvent
} from '#shared/types';

import { Default as DefaultShared, MimeType } from '#shared/static';

import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { signJwtToken } from '#shared/utils';
import { EnvException } from '#shared/exceptions';

import { Default as DefaultSpecs } from '#shared/specs/static/defaults';

import { Format } from '#/static';

import {
    AssetsConfig,
    AuthConfig,
    EnvConfig,
    HealthConfig,
    ValidationConfig
} from '#/configs';

import { AuthGuard } from '#/guards';
import { ExceptionLoggerFilter } from '#/filters';

import { ResourceData, ResourceDeleteDTO } from '#/modules/resource';
import { HealthModule, ResourceModule } from '#/modules';
import { LoggerService } from '#/services';

enum FileSample {
    Correct,
    WrongExt,
    WrongName,
    WrongSize
}

const specs = {
    imagesDir: UploadEvent.Image + 's',
    chunkSize: 10 * 1024
};

describe('Resource module tests.', () => {
    let app: INestApplication;
    let logger: LoggerService;
    let accessToken: string;

    let assets: IAssetsConfig['assets'];

    const file: {
        samplesRoot: string;
        samples: string[];
        ext: string;
        imagesDirPath: string;
    } = {
        samplesRoot: '',
        samples: [],
        ext: '',
        imagesDirPath: ''
    };

    beforeAll(async () => {
        const metadata: ModuleMetadata = {
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [
                        AssetsConfig,
                        AuthConfig,
                        EnvConfig,
                        HealthConfig,
                        ValidationConfig
                    ]
                }),
                ServeStaticModule.forRoot({
                    rootPath: AssetsConfig().assets.root,
                    serveRoot: AssetsConfig().assets.root,
                    serveStaticOptions: { index: false }
                }),
                JwtModule.register({
                    global: true,
                    secret: AuthConfig().auth.jwtSecret,
                    signOptions: {
                        expiresIn: AuthConfig().auth.jwtExpireTimeS
                    }
                }),
                HealthModule,
                ResourceModule
            ],
            providers: [
                AuthGuard,
                LoggerService,
                { provide: APP_FILTER, useClass: ExceptionLoggerFilter }
            ]
        };

        const moduleFixture: TestingModule = await Test.createTestingModule(
            metadata
        ).compile();
        app = await moduleFixture.createNestApplication().init();

        // Configs
        const configService: ConfigService<
            IValidationConfig & IEnvConfig & IAuthConfig & IAssetsConfig
        > = app.get(ConfigService);
        const env: IEnvConfig['env'] = configService.getOrThrow('env');
        const validation: IValidationConfig['validation'] =
            configService.getOrThrow('validation');

        // Auth
        const auth: IAuthConfig['auth'] = configService.getOrThrow('auth');
        if (!auth.jwtSecret) throw new EnvException(`JWT Secret isn't set`);

        // Pipes
        app.useGlobalPipes(new ValidationPipe(validation.config));

        // Logger
        logger = app.get(LoggerService);
        const logLevels: LogLevel[] =
            env.state === NodeEnv.Production
                ? ['log', 'error', 'warn']
                : ['log', 'error', 'warn', 'debug', 'verbose'];
        logger.setLogLevels(logLevels);
        app.useLogger(logger);

        const token = await signJwtToken(
            moduleFixture.get<JwtService>(JwtService),
            auth.jwtSecret,
            1,
            'username'
        );
        accessToken = `Bearer ${token}`;
        logger.debug(token);

        assets = configService.getOrThrow('assets');
        file.imagesDirPath = path.join(assets.root, specs.imagesDir);
        file.samplesRoot = path.join(assets.root, 'samples');

        // Assets
        let largeFileBuffer: Buffer = Buffer.alloc(assets.fileMaxSizeB + 1);
        const sampleBuffer: Buffer = Buffer.alloc(specs.chunkSize).fill('a');
        for (let i = 0; i <= assets.fileMaxSizeB / specs.chunkSize; i++)
            largeFileBuffer = Buffer.concat([largeFileBuffer, sampleBuffer]);
        file.ext = assets.allowedExtensions?.[0] ?? 'ext';
        file.samples.push(
            path.join(file.samplesRoot, `sample.${file.ext}`),
            path.join(file.samplesRoot, `sampleWrongExt.${file.ext}$`),
            path.join(file.samplesRoot, `sa#pleWr$ngName.${file.ext}`),
            path.join(file.samplesRoot, `sampleWrongSize.${file.ext}`)
        );
        fs.mkdirSync(file.samplesRoot, { recursive: true });
        file.samples.forEach((file) => fs.writeFileSync(file, ''));
        fs.writeFileSync(file.samples[FileSample.WrongSize], largeFileBuffer, {
            flag: 'a'
        });
    }, DefaultSpecs.specs.hookTimeoutMs);
    beforeEach((done: jest.DoneCallback) => {
        fs.mkdirSync(file.imagesDirPath, { recursive: true });
        done();
    });
    afterEach((done: jest.DoneCallback) => {
        fs.rmSync(file.imagesDirPath, { recursive: true, force: true });
        done();
    });
    afterAll((done: jest.DoneCallback) => {
        fs.rmSync(assets.root, { recursive: true, force: true });
        done();
    });

    describe('/resource/delete DELETE', function () {
        const getReq = (path: string): request.Test => {
            const dto: ResourceDeleteDTO = { resource: { path } };
            return (
                request(app.getHttpServer())
                    .delete('/resource/delete')
                    .set('authorization', accessToken)
                    // eslint-disable-next-line sonarjs/no-duplicate-string
                    .set('Accepts', MimeType.ApplicationJson)
                    .query(dto)
            );
        };

        const getTargetPath = (): string =>
            path.join(specs.imagesDir, `target.${file.ext}`);

        it(
            'should prevent delete the non existing target file',
            async () => {
                const res: Response = await getReq(getTargetPath() + 'x');
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(
                    `Error: the target resource can't be found!`
                );
                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'should delete the target resource',
            async () => {
                fs.writeFileSync(path.join(assets.root, getTargetPath()), '');
                const res: Response = await getReq(getTargetPath());
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(
                    `Successfully deleted the resource`
                );
                expect(res.statusCode).toEqual(HttpStatus.OK);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );
    });

    describe('/resource/update PUT', function () {
        const getReq = (targetPath: string, file: string): request.Test =>
            request(app.getHttpServer())
                .put('/resource/update')
                .set('authorization', accessToken)
                .set('Content-type', MimeType.MultipartFormData)
                .set('Accepts', MimeType.MultipartFormData)
                .field('path', targetPath)
                .attach(UploadEvent.Image, file);

        const targetPath: string = path.join(
            specs.imagesDir,
            `target.${file.ext}`
        );

        it(
            'should prevent update the non existing target file',
            async () => {
                const res: Response = await getReq(
                    targetPath + 'x',
                    file.samples[FileSample.Correct]
                );
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(
                    `Error: the target resource can't be found!`
                );
                expect(res.statusCode).toEqual(HttpStatus.NOT_FOUND);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'should update the target resource',
            async () => {
                fs.writeFileSync(path.join(assets.root, targetPath), '');
                const res: Response = await getReq(
                    targetPath,
                    file.samples[FileSample.Correct]
                );
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(
                    `Successfully updated the resource`
                );
                expect(res.statusCode).toEqual(HttpStatus.OK);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );
    });

    describe('/resource/upload POST', function () {
        const getReq = (file: string): request.Test =>
            request(app.getHttpServer())
                .post('/resource/upload')
                .set('authorization', accessToken)
                .set('Content-type', MimeType.MultipartFormData)
                .set('Accepts', MimeType.MultipartFormData)
                .attach(UploadEvent.Image, file);

        it(
            'should prevent upload resources with incorrect file size',
            async () => {
                const res: Response = await getReq(
                    file.samples[FileSample.WrongSize]
                );
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(`Error: File too large`);
                expect(res.statusCode).toEqual(HttpStatus.PAYLOAD_TOO_LARGE);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'should prevent upload resources with incorrect filename',
            async () => {
                const res: Response = await getReq(
                    file.samples[FileSample.WrongName]
                );
                const body = res.body as ServiceRes;
                expect(body.message).toEqual(
                    `Error: the filename should contain only '${DefaultShared.file.name.allowedChars}' and have no more than ${DefaultShared.file.name.maxlength} symbols in length!`
                );
                expect(res.statusCode).toEqual(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
                );
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'should prevent upload resources with incorrect extension',
            async () => {
                const res: Response = await getReq(
                    file.samples[FileSample.WrongExt]
                );
                const body = res.body as ServiceRes;
                const expectedExt = path
                    .extname(file.samples[FileSample.WrongExt])
                    .slice(1);
                expect(body.message).toEqual(
                    "Error: unacceptable file extension '" + expectedExt + "'!"
                );
                expect(res.statusCode).toEqual(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE
                );
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'should upload resources',
            async () => {
                const res: Response = await getReq(
                    file.samples[FileSample.Correct]
                );
                const body = res.body as ServiceRes<Resource>;
                const filePath: string = path.join(
                    assets.root,
                    body.payload.path
                );

                expect(fs.existsSync(filePath)).toEqual(true);
                expect(body.message).toEqual(
                    'Successfully uploaded the resource'
                );
                expect(res.statusCode).toEqual(HttpStatus.CREATED);
                logger.debug('Saved file: ' + filePath, 'E2E');
            },
            DefaultSpecs.specs.hookTimeoutMs
        );
    });

    describe('DTO', function () {
        const samplePath: string = expandN(Format.path.format, 1)[0];

        it(
            'Should create DTO',
            async () => {
                const dtoPlain: ResourceData = { path: samplePath };
                const dto: ResourceData = plainToInstance(
                    ResourceData,
                    dtoPlain
                );
                const errors: ValidationError[] = await validate(dto);
                expect(errors.length).toEqual(0);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );

        it(
            'Should prevent create DTO with incorrect path format',
            async () => {
                const dtoPlain: ResourceData = { path: samplePath + '@' };
                const dto: ResourceData = plainToInstance(
                    ResourceData,
                    dtoPlain
                );
                const errors: ValidationError[] = await validate(dto);
                const expectVal: string | undefined =
                    errors?.[0]?.constraints?.matches;
                expect(expectVal).toEqual(Format.path.errorMessage);
            },
            DefaultSpecs.specs.hookTimeoutMs
        );
    });
});
