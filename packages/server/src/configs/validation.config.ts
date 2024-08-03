import { IConfig } from '#/types';
import { Config } from '#/static';

export default (): Pick<IConfig, 'validation'> => ({
    validation: Config.validation
});
