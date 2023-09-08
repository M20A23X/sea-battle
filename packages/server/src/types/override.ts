declare module 'http' {
    interface IncomingHttpHeaders {
        'x-refresh-token'?: string;
    }
}
