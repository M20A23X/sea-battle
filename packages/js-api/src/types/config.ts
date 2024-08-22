import {
    IEnvConfig,
    IEnvDefault,
    IHealthConfig,
    IHealthDefault,
    IJwtConfig,
    IJwtDefault,
    IValidationConfig,
    IValidationDefault
} from '#shared/types/interfaces';
import {
    IDatabaseConfig,
    IDatabaseDefault,
    IEmailConfig,
    IEmailDefault,
    IAssetsConfig,
    IPublicDefault
} from '#/types/interfaces';

interface IConfig {
    validation: IValidationConfig;
    env: IEnvConfig;
    health: IHealthConfig;
    jwt: IJwtConfig;
    database: IDatabaseConfig;
    email: IEmailConfig;
    assets: IAssetsConfig;
}
interface IDefault {
    validation: IValidationDefault;
    env: IEnvDefault;
    health: IHealthDefault;
    jwt: IJwtDefault;
    database: IDatabaseDefault;
    email: IEmailDefault;
    public: IPublicDefault;
}

export { IConfig, IDefault };
