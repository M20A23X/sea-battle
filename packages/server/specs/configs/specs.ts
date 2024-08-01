import { SpecsConfig } from '#shared/static';
import { IConfigSpecs } from '#shared/types/interfaces';
import { getEnvFloat } from '#shared/utils';

export default (): IConfigSpecs => ({
    specs: {
        getHookTimeoutMs: () =>
            getEnvFloat(
                'SPECS_HOOK_TIMEOUT',
                SpecsConfig.specs.getHookTimeoutMs()
            )
    }
});
