import { IEnvConfig, NodeEnv } from '#shared/types';
import { Default as DefaultShared } from '#shared/static';

export default (): IEnvConfig => ({
    env: {
        port: parseInt(process.env.APP_PORT || '' + DefaultShared.env.port),
        state: (process.env.NODE_ENV as NodeEnv) || DefaultShared.env.state
    }
});
