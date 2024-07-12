import { TemplateDelegate } from 'handlebars';

enum PublicTemplates {
    EmailConfirm = 'email-confirm',
    PasswordReset = 'password-reset'
}

interface ITemplatedData {
    name: string;
    link: string;
}

interface ITemplates {
    confirmation: TemplateDelegate<ITemplatedData>;
    passwordReset: TemplateDelegate<ITemplatedData>;
}

export { PublicTemplates, ITemplatedData, ITemplates };
