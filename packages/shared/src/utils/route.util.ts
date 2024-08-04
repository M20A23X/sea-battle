import { IRoute } from '#/types';

const getRoute = <T extends IRoute[keyof IRoute]>(
    controller: T,
    route?: keyof Omit<T, 'index'>
): string =>
    controller.index + (typeof route === 'string' ? controller[route] : '');

export { getRoute };
