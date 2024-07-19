import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { createTransport, SentMessageInfo, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { IEnvConfig, IUser, NodeEnv } from '#shared/types/interfaces';

import { IConfig, ITemplatedData, ITemplates, PublicTemplates } from '#/types';
import { IAssetsConfig, IEmailConfig } from '#/types/interfaces';

import { LoggerService } from '#/services';

interface IMailerService {
    sendEmail(user: IUser, token: string, type: PublicTemplates): Promise<void>;
}

@Injectable()
class MailerService implements IMailerService {
    // --- Configs -------------------------------------------------------------
    private readonly _email: IEmailConfig;
    private readonly _env: IEnvConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: LoggerService = new LoggerService(
        MailerService.name
    );

    // --- Misc -------------------------------------------------------------
    private readonly _transport: Transporter<SentMessageInfo>;
    private readonly _templates: ITemplates;

    // --- Constructor -------------------------------------------------------------
    constructor(private readonly _configService: ConfigService<IConfig>) {
        this._logger.log('Initializing a Mailer service...');

        this._email = this._configService.getOrThrow('email');
        this._env = this._configService.getOrThrow('env');

        const publicConfig: IAssetsConfig =
            this._configService.getOrThrow('assets');

        const templatesPath: string = publicConfig.templates.path;

        if (this._env.state === NodeEnv.Testing) {
            this._logger.debug(
                'Skipping creating an email transport because of running in the testing env...'
            );
            return;
        }

        this._transport = createTransport(
            new SMTPTransport({
                host: this._email.host,
                secure: this._email.secure,
                port: this._email.port,
                auth: {
                    type: 'LOGIN',
                    user: this._email.credentials.username,
                    pass: this._email.credentials.password
                }
            })
        );
        this._templates = {
            confirmation: this._parseTemplate(
                templatesPath,
                PublicTemplates.EmailConfirmation
            ),
            passwordReset: this._parseTemplate(
                templatesPath,
                PublicTemplates.PasswordResetting
            )
        };
    }

    // --- Instance -------------------------------------------------------------

    // --- Public --------------------

    //--- sendEmail -----------
    public async sendEmail(
        user: IUser,
        token: string,
        type: PublicTemplates
    ): Promise<void> {
        if (this._env.state === NodeEnv.Testing) {
            this._logger.debug(
                'Skipping sending email because of running in the testing env...'
            );
            return;
        }

        const { email, username: name } = user;

        this._logger.log('Sending a new email...');
        this._logger.debug({ user, token, type });

        const subject =
            type === PublicTemplates.PasswordResetting
                ? 'Reset your password'
                : 'Confirm your email';
        const html: string = this._templates[type]({
            name,
            link: `${this._env.frontEndOrigin}/auth/${type}/${token}`
        });

        this._logger.debug({ subject, html });

        await this._transport.sendMail({
            from: this._email.credentials.username,
            to: email,
            subject,
            html
        });
    }

    // --- Private --------------------

    //--- _parseTemplate -----------
    private _parseTemplate(
        templatesPath: string,
        template: PublicTemplates
    ): Handlebars.TemplateDelegate<ITemplatedData> {
        this._logger.log('Parsing the template...');
        this._logger.debug({ templatesPath, template });

        const templateText = fs.readFileSync(
            path.join(templatesPath, template) + '.hbs',
            'utf-8'
        );

        this._logger.debug({ templateText });

        return Handlebars.compile<ITemplatedData>(templateText, {
            strict: true
        });
    }
}

export { MailerService };
