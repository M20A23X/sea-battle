import { NodeEnv, IEnvConfig, IAssetsConfig } from '#shared/types';

type DefaultConfig = IEnvConfig & IAssetsConfig;

const Default: DefaultConfig = {
    env: {
        port: 5001,
        state: NodeEnv.Development
    },
    assets: {
        root: '',
        dir: 'assets',
        fileMaxSizeB: 5 * 1024 ** 2,
        allowedExtensions: ['png']
    }
};

export { Default };
