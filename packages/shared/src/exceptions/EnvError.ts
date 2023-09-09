export class EnvError extends Error {
    constructor(message: string) {
        super(`Environment error! ${message}`);
    }
}
