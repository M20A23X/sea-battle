import { IConfigSpecsDefault } from '../types/specs';

const SpecsConfig: IConfigSpecsDefault = {
    specs: {
        getHookTimeoutMs: () => 50000,
        connectionCheckIntervalMs: 200
    }
};

export { SpecsConfig };
