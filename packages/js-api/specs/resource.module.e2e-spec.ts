import * as fs from 'fs';
import * as path from 'path';
import { v4 } from 'uuid';
import * as Jwt from 'jsonwebtoken';
import request from 'supertest';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

import {
    IAccessPayload,
    IConfigSpecs,
    IEnvConfig,
    IJwtConfig,
    MimeType,
    TokenTypeEnum,
    UploadEvent
} from '#shared/types/interfaces';
import { Format, Route } from '#shared/static';
import { getRoute } from '#shared/utils';

import { SpecsConfig } from './configs';
import { init, requireRunTest } from './utils';

import { IConfig } from '#/types';
import { IAssetsConfig, IEmailConfig } from '#/types/interfaces';

import { ResourceDeleteDTO } from '#/modules/resource';
import { LoggerService } from '#/services';

enum FileSampleEnum {
    Correct,
    WrongExt,
    WrongName,
    WrongSize
}

const Specs = { chunkSize: 10 * 1024 };

describe('Resource module tests.', () => {
    // --- Logger -------------------------------------------------------------
    let logger: LoggerService;

    // --- Jwt --------------------
    let accessToken: string;

    // --- Configs --------------------
    let assets: IAssetsConfig;
    let env: IEnvConfig;

    // --- Test --------------------
    const file: {
        samplesPath: string;
        samples: string[];
        ext: string;
        imagesDirPath: string;
    } = {
        samplesPath: '',
        samples: [],
        ext: '',
        imagesDirPath: ''
    };

    const targetPath: string = path.join(
        UploadEvent.Images,
        `target.${file.ext}`
    );

    let runTest: ReturnType<typeof requireRunTest>;

    beforeAll(async () => {
        const [app, _, _logger, _accessToken] = await init();
        logger = _logger;
        accessToken = _accessToken;

        // --- Configs --------------------
        const configService: ConfigService<IConfig & IConfigSpecs> =
            app.get(ConfigService);
        assets = configService.getOrThrow('assets');
        env = configService.getOrThrow('env');
        const jwt: IJwtConfig = configService.getOrThrow('jwt');
        const email: IEmailConfig = configService.getOrThrow('email');

        runTest = requireRunTest(app, accessToken, env.frontEndOrigin);

        // --- JWT --------------------
        const jwtOptions: JwtSignOptions = {
            issuer: env.appId,
            audience: env.frontEndOrigin,
            subject: email.credentials.username,
            expiresIn: jwt.tokens[TokenTypeEnum.ACCESS].timeMs,
            algorithm: 'RS256'
        };
        const jwtPayload: IAccessPayload = { uuid: v4(), username: 'username' };
        const token: string = Jwt.sign(
            jwtPayload,
            jwt.tokens[TokenTypeEnum.ACCESS].privateKey,
            jwtOptions
        );
        accessToken = `Bearer ${token}`;
        logger.debug(token);

        // --- Assets --------------------
        file.imagesDirPath = path.join(assets.assets.path, UploadEvent.Images);
        file.ext = assets.assets.allowedExtensions?.[0] ?? 'ext';

        let largeFileBuffer: Buffer = Buffer.alloc(
            assets.assets.fileMaxSizeB + 1
        );
        const sampleBuffer: Buffer = Buffer.alloc(Specs.chunkSize).fill('a');
        for (let i = 0; i <= assets.assets.fileMaxSizeB / Specs.chunkSize; i++)
            largeFileBuffer = Buffer.concat([largeFileBuffer, sampleBuffer]);

        const samplesPath: string = path.join(assets.assets.path, 'samples');
        file.samples[FileSampleEnum.Correct] = path.join(
            samplesPath,
            `sample.${file.ext}`
        );
        file.samples[FileSampleEnum.WrongExt] = path.join(
            samplesPath,
            `sampleWrongExt.${file.ext}$`
        );
        file.samples[FileSampleEnum.WrongName] = path.join(
            samplesPath,
            `sa#pleWr$ngName.${file.ext}`
        );
        file.samples[FileSampleEnum.WrongSize] = path.join(
            samplesPath,
            `sampleWrongSize.${file.ext}`
        );

        fs.mkdirSync(samplesPath, { recursive: true });
        file.samples.forEach((file) => fs.writeFileSync(file, ''));
        fs.writeFileSync(
            file.samples[FileSampleEnum.WrongSize],
            largeFileBuffer,
            { flag: 'a' }
        );
    }, SpecsConfig().specs.getHookTimeoutMs());
    beforeEach(
        async () => fs.mkdirSync(file.imagesDirPath, { recursive: true }),
        SpecsConfig().specs.getHookTimeoutMs()
    );

    afterEach(
        async () =>
            fs.rmSync(file.imagesDirPath, { recursive: true, force: true }),
        SpecsConfig().specs.getHookTimeoutMs()
    );
    afterAll(
        async () =>
            fs.rmSync(assets.assets.path, { recursive: true, force: true }),
        SpecsConfig().specs.getHookTimeoutMs()
    );

    describe(Route.resource.index + ' DELETE', function () {
        const runDeleteTest = (
            dto: ResourceDeleteDTO,
            status: HttpStatus = HttpStatus.OK,
            message = `Successfully deleted the resource`
        ): Promise<void> => {
            const url: string = getRoute(Route.resource);
            return runTest(
                'delete',
                url,
                (req: request.Test) => req.send(dto),
                status,
                message
            );
        };

        it(
            'should prevent delete the non existing target file',
            async () => {
                const dto: ResourceDeleteDTO = {
                    resource: { path: targetPath + 'x' }
                };
                await runDeleteTest(
                    dto,
                    HttpStatus.NOT_FOUND,
                    `Error: target resource isn't found`
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );

        it(
            'should delete the target resource',
            async () => {
                fs.writeFileSync(path.join(assets.assets.path, targetPath), '');
                const dto: ResourceDeleteDTO = {
                    resource: { path: targetPath }
                };
                await runDeleteTest(dto);
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );
    });

    describe(Route.resource.index + ' PUT', function () {
        const runUpdateTest = (
            targetPath: string,
            file: string,
            status: HttpStatus,
            message
        ): Promise<void> => {
            const url: string = getRoute(Route.resource);
            return runTest(
                'put',
                url,
                (req: request.Test) => {
                    return req
                        .field('path', targetPath)
                        .attach(UploadEvent.Images, file);
                },
                status,
                message,
                MimeType.MultipartFormData
            );
        };

        it(
            'should prevent update the non existing target file',
            async () => {
                await runUpdateTest(
                    targetPath + 'x',
                    file.samples[FileSampleEnum.Correct],
                    HttpStatus.NOT_FOUND,
                    `Error: target resource isn't found`
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );

        it(
            'should update the target resource',
            async () => {
                fs.writeFileSync(path.join(assets.assets.path, targetPath), '');

                await runUpdateTest(
                    targetPath,
                    file.samples[FileSampleEnum.Correct],
                    HttpStatus.OK,
                    `Successfully updated the resource`
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );
    });

    describe(Route.resource.index + ' POST', function () {
        const runCreateTest = (
            file: string,
            status: HttpStatus,
            message
        ): Promise<void> => {
            const url: string = getRoute(Route.resource);
            return runTest(
                'post',
                url,
                (req: request.Test) => req.attach(UploadEvent.Images, file),
                status,
                message,
                MimeType.MultipartFormData
            );
        };

        it(
            'should prevent upload resources with incorrect file size',
            async () => {
                await runCreateTest(
                    file.samples[FileSampleEnum.WrongSize],
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    `Error: File too large`
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );

        it(
            'should prevent upload resources with incorrect filename',
            async () => {
                await runCreateTest(
                    file.samples[FileSampleEnum.WrongName],
                    HttpStatus.UNPROCESSABLE_ENTITY,
                    'Error: ' + Format.filename.errorMessage
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );

        it(
            'should prevent upload resources with incorrect extension',
            async () => {
                await runCreateTest(
                    file.samples[FileSampleEnum.WrongExt],
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    'Error: incorrect extension'
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );

        it(
            'should upload resources',
            async () => {
                await runCreateTest(
                    file.samples[FileSampleEnum.Correct],
                    HttpStatus.CREATED,
                    'Successfully uploaded the resource'
                );
            },
            SpecsConfig().specs.getHookTimeoutMs()
        );
    });
});
