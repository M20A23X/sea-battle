export const FORMAT = {
    fallback: {
        maxReadAmount: 10,
    },
    usersSchema: {
        uuid: {
            regex: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
            maxLength: 36,
        },
        jwt: {
            regex: /^[\w-]+\.[\w-]+\.[\w-]+$/,
        },
        imgUrl: {
            regex: /^http(s)?:\/\/.+$/,
            maxLength: 500,
            errorMessage: 'imgUrl must be valid url!',
        },
        username: {
            regex: /^[a-z0-9]+$/i,
            errorMessage: 'username can contain only letters and numbers!',
            minLength: 6,
            maxLength: 30,
        },
        password: {
            regex: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w)\w/,
            errorMessage:
                'password must contain at least one uppercase letter, one lowercase letter, one number and one special character!',
            minLength: 6,
            maxLength: 60,
        },
    },
};

export const { fallback: FALLBACK, usersSchema: USERS_SCHEMA } = FORMAT;
