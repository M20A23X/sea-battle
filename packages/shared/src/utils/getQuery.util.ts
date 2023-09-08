export const getQuery = <T extends object>(dto: T) =>
    Object.entries(dto)
        .map(([key, value]) => key.concat('=').concat(value))
        .join('&');
