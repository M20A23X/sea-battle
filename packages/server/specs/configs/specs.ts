import { SpecsConfig } from '#shared/specs/static';
import { IConfigSpecs } from '#shared/specs/types';
import { getEnvFloat } from '#shared/utils';

export default (): IConfigSpecs => ({
    specs: {
        getHookTimeoutMs: () =>
            getEnvFloat(
                'SPECS_HOOK_TIMEOUT',
                SpecsConfig.specs.getHookTimeoutMs()
            ),
        connectionCheckIntervalMs: getEnvFloat(
            'SPECS_CONNECTION_CHECK_INTERVAL',
            SpecsConfig.specs.connectionCheckIntervalMs
        )
    }
});
