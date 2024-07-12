import { IConfigBase, IConfigDefaultBase } from '#shared/types/config';
import { IEnvConfigDefault } from '#shared/types/interfaces';
import {
    IDatabaseConfig,
    IDatabaseConfigDefault
} from '#/types/interfaces/database.interface';
import {
    IEmailConfig,
    IEmailConfigDefault
} from '#/types/interfaces/email.interface';
import { IAssetsConfig } from '#/types/interfaces';

interface IConfig extends IConfigBase {
    database: IDatabaseConfig;
    email: IEmailConfig;
    assets: IAssetsConfig;
}

interface IConfigDefault extends IConfigDefaultBase {
    database: IDatabaseConfigDefault;
    email: IEmailConfigDefault;
    env: IEnvConfigDefault;
}

export { IConfig, IConfigDefault };
