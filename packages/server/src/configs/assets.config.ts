import * as path from 'path';
import * as process from 'process';
import fs from 'fs';
import { diskStorage } from 'multer';
import express from 'express';
import {
    HttpStatus,
    UnprocessableEntityException,
    UnsupportedMediaTypeException
} from '@nestjs/common';

import { getEnvArray, getEnvFloat, getEnvString } from '#shared/utils';
import { Format } from '#shared/static';
import { IAssetsConfig } from '#/types/interfaces';
import { IConfig } from '#/types';

import { Config } from '#/static';

export default (): Pick<IConfig, 'assets'> => {
    const publicDir: string = getEnvString(
        'PUBLIC_DIR',
        Config.public.public.dir
    );
    const publicPath: string = path.join(process.cwd(), publicDir);
    const templatesDir: string = getEnvString(
        'TEMPLATES_DIR',
        Config.public.templates.dir
    );
    const assetsDir: string = getEnvString(
        'ASSETS_DIR',
        Config.public.assets.dir
    );

    const assets: IAssetsConfig['assets'] = {
        dir: assetsDir,
        path: path.join(publicPath, assetsDir),
        fileMaxSizeB: getEnvFloat(
            'MAX_FILE_SIZE_B',
            Config.public.assets.fileMaxSizeB
        ),
        allowedExtensions: getEnvArray(
            'ALLOWED_EXTENSIONS',
            Config.public.assets.allowedExtensions
        )
    };

    return {
        assets: {
            assets: {
                dir: assetsDir,
                path: path.join(publicPath, assetsDir),
                allowedExtensions: getEnvArray(
                    'RESOURCE_ALLOWED_EXTENSIONS',
                    Config.public.assets.allowedExtensions
                ),
                fileMaxSizeB: getEnvFloat(
                    'RESOURCE_MAX_SIZE_B',
                    Config.public.assets.fileMaxSizeB
                )
            },
            public: { dir: publicDir, path: publicPath },
            templates: {
                dir: templatesDir,
                path: path.join(publicPath, templatesDir)
            },
            multer: {
                dest: path.join(publicPath, assetsDir),
                limits: {
                    fileSize: assets.fileMaxSizeB,
                    fields: 1,
                    files: 1
                },
                storage: diskStorage({
                    destination: (
                        req: express.Request,
                        file: Express.Multer.File,
                        next
                    ) => {
                        const destinationDir: string = path.join(
                            assets.path,
                            file.fieldname
                        );
                        if (!fs.existsSync(destinationDir))
                            fs.mkdirSync(destinationDir, {
                                recursive: true
                            });

                        return next(null, destinationDir);
                    },
                    filename: (
                        req: express.Request,
                        file: Express.Multer.File,
                        next
                    ) => {
                        const date: string = new Date()
                            .toISOString()
                            .replace(/:/g, '-');
                        const fileName = `${date}-${file.originalname}`;
                        return next(null, fileName);
                    }
                }),
                fileFilter: (
                    req: express.Request,
                    file: Express.Multer.File,
                    next
                ) => {
                    const extension: string = path
                        .extname(file.originalname)
                        .slice(1);
                    const isExtensionValid: boolean =
                        assets.allowedExtensions.includes(extension);
                    if (!isExtensionValid) {
                        return next(
                            new UnsupportedMediaTypeException(
                                'incorrect extension'
                            ),
                            false
                        );
                    }

                    const isNameValid: boolean = Format.filename.regex.test(
                        file.originalname
                    );
                    if (!isNameValid) {
                        return next(
                            new UnprocessableEntityException(
                                'incorrect file name'
                            ),
                            false
                        );
                    }

                    return next(null, true);
                }
            }
        }
    };
};
