export const DATABASE = {
    fallback: {
        maxReadAmount: 10,
    },
    usersSchema: {
        imgUrl: { maxLength: 500 },
        username: {
            format: /^[a-z0-9]+$/i,
            errorMessage: 'username can contain only letters and numbers!',
            minLength: 6,
            maxLength: 30,
        },
        password: {
            format: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\w)\w/,
            errorMessage:
                'password must have at least one uppercase letter, one lowercase letter, one number and one special character!',
            minLength: 6,
            maxLength: 60,
        },
    },
};

export const { fallback: FALLBACK, usersSchema: USERS_SCHEMA } = DATABASE;
