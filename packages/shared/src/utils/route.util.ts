const getRoute = <T extends { index: string } & Record<string, string>>(
    controller: T,
    route?: keyof Omit<T, 'index'>
): string =>
    controller.index + (typeof route === 'string' ? controller[route] : '');

export { getRoute };
