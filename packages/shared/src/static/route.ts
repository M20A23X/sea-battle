const Route = {
    users: { index: '/users' },
    health: {
        index: '/health',
        status: '/status'
    },
    auth: {
        index: '/auth',
        signup: '/signup',
        emailConfirmation: '/email-confirmation',
        passwordResetRequest: '/password-reset-request',
        passwordResetting: '/password-resetting',
        signIn: '/signin',
        accessRefresh: '/refresh',
        signOut: '/signout'
    }
};

export { Route };
