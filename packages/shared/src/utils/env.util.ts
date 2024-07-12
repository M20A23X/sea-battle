const getEnvFloat = (key: string, fallback: number): number => {
    const parsed: number = parseFloat(process.env[key] ?? '');
    if (isNaN(parsed)) return fallback;
    return parsed === 0 ? 0 : parsed;
};

const getEnvString = (key: string, fallback?: string): string => {
    return process.env[key] ?? fallback ?? '';
};
const getEnvArray = (key: string, fallback: string[]): string[] => {
    return process.env[key]?.split(' ') ?? fallback;
};
const getEnvBool = (key: string, fallback: boolean): boolean => {
    return Boolean(process.env[key] ?? fallback);
};

export { getEnvFloat, getEnvString, getEnvArray, getEnvBool };
