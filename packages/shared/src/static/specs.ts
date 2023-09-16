const SPECS_DATA_AMOUNT: number = parseInt(
    process.env.SPECS_DATA_AMOUNT ?? '20'
);
const SPECS_HOOK_TIMEOUT_MS: number = parseInt(
    process.env.SPECS_HOOK_TIMEOUT_MS ?? '50000'
);
const CONNECTION_CHECK_INTERVAL_MS: number = parseInt(
    process.env.CONNECTION_CHECK_INTERVAL_MS ?? '200'
);

export {
    SPECS_DATA_AMOUNT,
    SPECS_HOOK_TIMEOUT_MS,
    CONNECTION_CHECK_INTERVAL_MS
};
