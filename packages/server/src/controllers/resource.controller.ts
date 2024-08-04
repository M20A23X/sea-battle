import { FileInterceptor } from '@nestjs/platform-express';
import {
    Body,
    Controller,
    Delete,
    Inject,
    ParseFilePipe,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces
} from '@nestjs/swagger';

import {
    IResource,
    MimeType,
    Res,
    UploadEvent
} from '#shared/types/interfaces';

import { Route } from '#shared/static';
import { AssetsConfig, ValidationConfig } from '#/configs';

import { AuthGuard } from '#/guards';

import { ResourceDTO } from '#/modules/base';
import { ResourceDeleteDTO } from '#/modules/resource';
import { ResourceService } from '#/services';

interface IResourceController {
    postCreateResource: (file: Express.Multer.File) => Res<IResource>;
    putUpdateResource: (
        file: Express.Multer.File,
        body: ResourceDTO
    ) => Res<IResource>;
    deleteResource: (query: ResourceDeleteDTO) => Res;
}

@Controller(Route.resource.index)
@UseGuards(AuthGuard)
class ResourceController implements IResourceController {
    // --- Constructor -------------------------------------------------------------
    constructor(
        @Inject(ResourceService)
        private readonly _resourceService: ResourceService
    ) {}

    // --- Static -------------------------------------------------------------

    // --- Private --------------------

    // --- _createParseFilePipe -----------
    public static _createParseFilePipe = () =>
        new ParseFilePipe(ValidationConfig().validation.parseFilePipe);

    // --- _createFileInterceptor -----------
    public static _createFileInterceptor = () =>
        FileInterceptor(UploadEvent.Images, AssetsConfig().assets.multer);

    // --- Instance -------------------------------------------------------------

    // --- Public --------------------

    // --- POST -----------
    @Post()
    @UseInterceptors(ResourceController._createFileInterceptor())
    @ApiConsumes(MimeType.MultipartFormData)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Upload a new resource' })
    public async postCreateResource(
        @UploadedFile(ResourceController._createParseFilePipe())
        file: Express.Multer.File
    ): Res<IResource> {
        const path: string = this._resourceService.upload(file);
        return {
            message: 'Successfully uploaded the resource',
            payload: { path }
        };
    }

    // --- PUT -----------
    @Put()
    @ApiBody({ type: ResourceDTO })
    @UseInterceptors(ResourceController._createFileInterceptor())
    @ApiConsumes(MimeType.MultipartFormData)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Update the resource' })
    public async putUpdateResource(
        @UploadedFile(ResourceController._createParseFilePipe())
        file: Express.Multer.File,
        @Body() body: ResourceDTO
    ): Res<IResource> {
        const newPath: string = this._resourceService.update(file, body.path);
        return {
            message: 'Successfully updated the resource',
            payload: { path: newPath }
        };
    }

    // --- DELETE -----------
    @Delete()
    @ApiBody({ type: ResourceDeleteDTO })
    @ApiConsumes(MimeType.ApplicationJson)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Delete the resource' })
    public async deleteResource(@Body() body: ResourceDeleteDTO): Res {
        this._resourceService.delete(body.resource.path);
        return { message: 'Successfully deleted the resource' };
    }
}

export { ResourceController };
