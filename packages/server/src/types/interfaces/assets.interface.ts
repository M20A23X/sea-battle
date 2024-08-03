import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

interface IStaticAssets {
    fileMaxSizeB: number;
    allowedExtensions: string[];
}
interface IDir {
    dir: string;
}

interface IFolder extends IDir {
    path: string;
}

interface IAssetsConfig {
    public: IFolder;
    templates: IFolder;
    assets: IFolder & IStaticAssets;
    multer: MulterOptions;
}

type IPublicDefault = {
    public: IDir;
    templates: IDir;
    assets: IDir & IStaticAssets;
    multer: {
        fields: number;
        files: number;
    };
};

export { IAssetsConfig, IPublicDefault };
