import { IRoute } from '#/types';

const Route: IRoute = {
    user: { index: '/users' },
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
    },
    resource: { index: '/resources' }
};

export { Route };
