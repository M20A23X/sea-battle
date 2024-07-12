enum NodeEnv {
    Production = 'production',
    Development = 'development',
    Testing = 'testing'
}

interface IEnvConfig {
    appId: string;
    appName: string;
    state: NodeEnv;
    port: number;
    portWs?: number;
    frontEndOrigin: string;
}

type IEnvDefault = Required<Omit<IEnvConfig, 'appId'>>;

export { NodeEnv, IEnvConfig, IEnvDefault };
