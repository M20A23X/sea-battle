interface ISpecsConfig {
    getHookTimeoutMs: () => number;
}

type ISpecsDefault = Required<ISpecsConfig>;

interface IConfigSpecs {
    specs: ISpecsConfig;
}

type IConfigSpecsDefault = IConfigSpecs;

export { ISpecsConfig, ISpecsDefault, IConfigSpecs, IConfigSpecsDefault };
