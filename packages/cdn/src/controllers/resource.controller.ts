import { FileInterceptor } from '@nestjs/platform-express';
import {
    Body,
    Controller,
    Delete,
    Inject,
    ParseFilePipe,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiProduces,
    ApiQuery
} from '@nestjs/swagger';

import { Res, Resource, UploadEvent } from '#shared/types';
import { MimeType } from '#shared/static';

import { AssetsConfig, ValidationConfig } from '#/configs';
import { AuthGuard } from '#/guards';

import { ResourceDeleteDTO, ResourceDTO } from '#/modules/resource';
import { IResourceService, ResourceService } from '#/services';

interface IResourceController {
    postCreateResource: (file: Express.Multer.File) => Res<Resource>;
    putUpdateResource: (
        file: Express.Multer.File,
        body: ResourceDTO
    ) => Res<Resource>;
    deleteResource: (query: ResourceDeleteDTO) => Res;
}

@Controller('/resource')
@UseGuards(AuthGuard)
class ResourceController implements IResourceController {
    constructor(
        @Inject(ResourceService)
        private readonly _resourceService: IResourceService
    ) {}

    ///--- Public ---///
    @Post('/upload')
    @UseInterceptors(FileInterceptor(UploadEvent.Image, AssetsConfig().multer))
    @ApiConsumes(MimeType.MultipartFormData)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Upload new resource' })
    public async postCreateResource(
        @UploadedFile(
            new ParseFilePipe(ValidationConfig().validation.parseFilePipe)
        )
        file: Express.Multer.File
    ): Res<Resource> {
        return this._resourceService.uploadResource(file);
    }

    @Put('/update')
    @ApiBody({ type: ResourceDTO })
    @UseInterceptors(FileInterceptor(UploadEvent.Image, AssetsConfig().multer))
    @ApiConsumes(MimeType.MultipartFormData)
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Update resource' })
    public async putUpdateResource(
        @UploadedFile(
            new ParseFilePipe(ValidationConfig().validation.parseFilePipe)
        )
        file: Express.Multer.File,
        @Body() body: ResourceDTO
    ): Res<Resource> {
        const { path } = body;
        return this._resourceService.updateResource(file, path);
    }

    @Delete('/delete')
    @ApiQuery({ type: ResourceDeleteDTO })
    @ApiProduces(MimeType.ApplicationJson)
    @ApiOperation({ summary: 'Delete resource' })
    public async deleteResource(@Query() query: ResourceDeleteDTO): Res {
        return this._resourceService.deleteResource(query.resource.path);
    }
}

export { IResourceController, ResourceController };
