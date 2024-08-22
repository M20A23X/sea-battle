import path from 'path';
import fs from 'fs';
import {
    ConsoleLogger,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IAssetsConfig } from '#/types/interfaces';
import { IConfig } from '#/types';

import { LoggerService } from '#/services';

interface IResourceService {
    upload: (file: Express.Multer.File) => string;
    update: (file: Express.Multer.File, filePath: string) => string;
    delete: (filePath: string) => void;
}

@Injectable()
class ResourceService implements IResourceService {
    // --- Configs -------------------------------------------------------------
    private readonly _assets: IAssetsConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: ConsoleLogger = new LoggerService(
        ResourceService.name
    );

    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(ConfigService)
        private readonly _configService: ConfigService<IConfig>
    ) {
        this._assets = _configService.getOrThrow('assets');
    }

    // --- Instance -------------------------------------------------------------

    // --- Public --------------------

    // --- uploadResource -----------
    public upload(file: Express.Multer.File): string {
        const filePath: string | undefined = file.path
            .split(this._assets.assets.path + path.sep)
            .pop();

        this._logger.debug({ path: file.path });

        if (!filePath || !fs.existsSync(file.path))
            throw new InternalServerErrorException('resource not save');

        return filePath;
    }

    // --- updateResource -----------
    public update(file: Express.Multer.File, filePath: string): string {
        const oldFilePath: string = path.join(
            this._assets.assets.path,
            filePath
        );

        this._logger.debug({ new: file.path, oldFilePath });

        if (!fs.existsSync(oldFilePath)) {
            fs.rmSync(file.path);
            throw new NotFoundException("target resource isn't found");
        }
        fs.rmSync(oldFilePath);

        return this.upload(file);
    }

    // --- deleteResource -----------
    public delete(filePath: string): void {
        const oldFilePath: string = path.join(
            this._assets.assets.path,
            filePath
        );

        this._logger.debug(`File: ${oldFilePath}`);
        if (!fs.existsSync(oldFilePath))
            throw new NotFoundException("target resource isn't found");

        fs.rmSync(oldFilePath, { force: true });
    }
}

export { ResourceService };
