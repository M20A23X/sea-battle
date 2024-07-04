import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import { IAssetsConfig } from '#shared/types';
import { Exception } from '#shared/exceptions';
import { Default as DefaultShared } from '#shared/static';

import { Default } from '#/static';

interface IAssetsConfigCDN extends IAssetsConfig {
    multer: MulterOptions;
}

const dir: string = process.env.ASSETS_DIR || Default.assets.dir;
const assets: IAssetsConfig['assets'] = {
    dir,
    root: path.join(process.cwd(), '..', '..', dir),
    fileMaxSizeB: parseInt(
        process.env.MAX_FILE_SIZE_B || '' + Default.assets.fileMaxSizeB
    ),
    allowedExtensions:
        process.env.ALLOWED_EXTENSIONS?.split(' ') ||
        Default.assets.allowedExtensions
};

export default (): IAssetsConfigCDN => ({
    assets,
    multer: {
        dest: path.resolve(),
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
                const destinationDir: string = path.resolve(
                    assets.root,
                    file.fieldname + 's'
                );
                if (!fs.existsSync(destinationDir))
                    fs.mkdirSync(destinationDir, { recursive: true });

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
        fileFilter: (req: express.Request, file: Express.Multer.File, next) => {
            const extension: string = path.extname(file.originalname).slice(1);
            const isExtensionValid: boolean =
                assets.allowedExtensions.includes(extension);
            if (!isExtensionValid)
                return next(
                    new Exception('UNACCEPTABLE_EXT', extension),
                    false
                );

            const isNameValid: boolean = DefaultShared.file.name.regex.test(
                file.originalname
            );
            if (!isNameValid)
                return next(
                    new Exception('UNACCEPTABLE_NAME', extension),
                    false
                );

            return next(null, true);
        }
    }
});
