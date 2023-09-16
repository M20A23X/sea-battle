export class EnvException extends Error {
    constructor(message: string) {
        super(`Environment error! ${message}`);
    }
}
