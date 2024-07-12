import { IDirPath, IPublicConfigBase } from '#shared/types/interfaces';

interface IAssetsConfig extends IPublicConfigBase {
    templates: IDirPath;
}

export { IAssetsConfig };
