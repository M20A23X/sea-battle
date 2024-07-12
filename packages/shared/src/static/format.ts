type FormatKey =
    | 'username'
    | 'uuid'
    | 'password'
    | 'filename'
    | 'path'
    | 'email';
interface IFormatValue {
    regex: RegExp;
    minLength: number;
    maxLength: number;
    errorMessage: string;
}
type IFormat = Record<FormatKey, IFormatValue>;

const SpecialSymbols = `~!@#$%^&*()_+\\-';:"<>,\\.?№=`;
const AllowedFileChars = 'a-zA-Z_0-9.';

const Format: IFormat = {
    uuid: {
        regex: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        minLength: 36,
        maxLength: 36,
        errorMessage: ' must be a valid UUID'
    },
    path: {
        regex: new RegExp(`^[:\\/\\\\\\-${AllowedFileChars}]+$`),
        minLength: 3,
        maxLength: 500,
        errorMessage: ' must be a valid path and have length 3-500 symbols'
    },
    email: {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
        minLength: 1,
        maxLength: 320,
        errorMessage: ' must be a valid email'
    },
    username: {
        regex: /^[a-z0-9]+$/i,
        minLength: 3,
        maxLength: 30,
        errorMessage:
            ' must contain only letters and numbers and have length 3-30 symbols'
    },
    password: {
        regex: new RegExp(
            `(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${SpecialSymbols}])[a-zA-Z\d${SpecialSymbols}]`
        ),
        minLength: 8,
        maxLength: 60,
        errorMessage:
            ' must contain at least one uppercase letter, one lowercase letter, ' +
            'one number, one special character and have length 8-60 symbols'
    },
    filename: {
        regex: new RegExp(`^[${AllowedFileChars}]+$`),
        minLength: 3,
        maxLength: 256,
        errorMessage: ` should contain only '${AllowedFileChars}'`
    }
};

export { Format };
