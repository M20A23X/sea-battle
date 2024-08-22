import { TemplateDelegate } from 'handlebars';

enum PublicTemplates {
    EmailConfirmation = 'email-confirm',
    PasswordResetting = 'reset-password'
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
