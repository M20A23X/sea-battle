import path from 'path';
import fs from 'fs';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IAssetsConfig, ServiceRes, Resource } from '#shared/types';
import { Exception } from '#shared/exceptions';
import { Default } from '#/static';

import { ILoggerService, LoggerService } from '#/services';

interface IResourceService {
    uploadResource: (file: Express.Multer.File) => ServiceRes<Resource>;
    updateResource: (
        file: Express.Multer.File,
        filePath: string
    ) => ServiceRes<Resource>;
    deleteResource: (filePath: string) => ServiceRes;
}

class ResourceService implements IResourceService {
    ///--- Private ---///
    private readonly _assets: IAssetsConfig['assets'] = Default.assets;

    private readonly _loggerService: ILoggerService = new LoggerService(
        ResourceService.name
    );

    constructor(
        @Inject(ConfigService)
        private readonly _configService: ConfigService<IAssetsConfig>
    ) {
        this._assets = _configService.getOrThrow('assets');
    }

    ///--- Public ---///
    public uploadResource(file: Express.Multer.File): ServiceRes<Resource> {
        const filePath: string | undefined = file.path
            .split(this._assets.dir + path.sep)
            .pop();

        this._loggerService.debug(`File: ${file.path}`);
        if (!filePath || !fs.existsSync(file.path))
            throw new Exception('RESOURCE_NOT_SAVED');

        return {
            message: 'Successfully uploaded the resource',
            payload: { path: filePath }
        };
    }

    public updateResource(
        file: Express.Multer.File,
        filePath: string
    ): ServiceRes<Resource> {
        const oldFilePath: string = path.join(this._assets.root, filePath);

        this._loggerService.debug(`New file: ${file.path}`);
        this._loggerService.debug(`Old file: ${oldFilePath}`);

        if (!fs.existsSync(oldFilePath)) {
            fs.rmSync(file.path);
            throw new Exception('NOT_FOUND', 'target resource');
        }
        fs.rmSync(oldFilePath);

        const {
            payload: { path: newFilePath }
        } = this.uploadResource(file);

        return {
            message: 'Successfully updated the resource',
            payload: { path: newFilePath }
        };
    }

    public deleteResource(filePath: string): ServiceRes {
        const oldFilePath: string = path.join(this._assets.root, filePath);

        this._loggerService.debug(`File: ${oldFilePath}`);
        if (!fs.existsSync(oldFilePath))
            throw new Exception('NOT_FOUND', 'target resource');

        fs.rmSync(oldFilePath, { force: true });

        return { message: 'Successfully deleted the resource' };
    }
}

export { IResourceService, ResourceService };
