const DATABASE = {
    usersEntity: {
        imgPath: { maxLength: 500 },
        username: { minLength: 6, maxLength: 30 },
        password: { minLength: 6, maxLength: 60 }
    }
};

const SPECIAL_SYMBOLS = ` ~!@#$%^&*()_+\\-';:"<>,.?№=`;
const {
    usersEntity: {
        username: {
            minLength: usernameMinLength,
            maxLength: usernameMaxLength
        },
        password: {
            minLength: passwordMinLength,
            maxLength: passwordMaxLength
        },
        imgPath: { maxLength: imgPathMaxLength }
    }
} = DATABASE;

const FORMAT = {
    fallback: {
        maxReadAmount: 10
    },
    usersSchema: {
        uuid: {
            regex: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
        },
        accessToken: {
            regex: /^[\w-]+\.[\w-]+\.[\w-]+$/
        },
        imgPath: {
            regex: new RegExp(`^(.+)\\/([^\\/]+){0,${imgPathMaxLength}}$`),
            errorMessage: 'imgPath must be valid path'
        },
        username: {
            regex: new RegExp(
                `^[a-z0-9]{${usernameMinLength},${usernameMaxLength}}$`,
                'i'
            ),
            errorMessage:
                'username should contain only letters and numbers and have length 6-30 symbols'
        },
        password: {
            regex: new RegExp(
                `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${SPECIAL_SYMBOLS}])[a-zA-Z\\d${SPECIAL_SYMBOLS}]{${passwordMinLength},${passwordMaxLength}}$`
            ),
            errorMessage:
                'password must contain at least one uppercase letter, one lowercase letter, one number, one special character and have length 6-60 symbols'
        }
    }
};

export const { fallback: FALLBACK, usersSchema: USERS_SCHEMA } = FORMAT;
export const { usersEntity: USER_ENTITY } = DATABASE;
