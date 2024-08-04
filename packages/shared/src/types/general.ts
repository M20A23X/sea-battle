type Service = 'user' | 'auth' | 'health';
// | 'resource';
type IRoute = Record<Service, { index: string } & Record<string, string>>;

export { Service, IRoute };
