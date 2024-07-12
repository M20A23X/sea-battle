import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { createTransport, SentMessageInfo, Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import { IEnvConfig, IUser } from '#shared/types/interfaces';

import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { IConfig, ITemplatedData, ITemplates, PublicTemplates } from '#/types';
import { IAssetsConfig, IEmailConfig } from '#/types/interfaces';

import { ILoggerService, LoggerService } from '#/services/logger.service';

interface IMailerService {
    sendEmailConfirmation(user: IUser, token: string): Promise<void>;
    sendResetPasswordEmail(user: IUser, token: string): Promise<void>;
}

@Injectable()
class MailerService implements IMailerService {
    // --- Configs -------------------------------------------------------------
    private readonly _email: IEmailConfig;
    private readonly _env: IEnvConfig;

    // --- Logger -------------------------------------------------------------
    private readonly _logger: ILoggerService = new LoggerService(
        MailerService.name
    );

    // --- Misc -------------------------------------------------------------
    private readonly _transport: Transporter<SentMessageInfo>;
    private readonly _templates: ITemplates;

    // --- Constructor -------------------------------------------------------------
    constructor(private readonly configService: ConfigService<IConfig>) {
        this._logger.log('Initializing a Mailer service...');

        this._email = this.configService.getOrThrow('email');
        this._env = this.configService.getOrThrow('email');

        const publicConfig: IAssetsConfig =
            this.configService.getOrThrow('assets');

        const templatesPath: string = publicConfig.templates.path;

        this._transport = createTransport(
            new SMTPTransport({
                service: 'Gmail',
                auth: {
                    type: 'Login',
                    user: this._email.credentials.username,
                    pass: this._email.credentials.password
                }
            })
        );
        this._templates = {
            confirmation: MailerService._parseTemplate(
                templatesPath,
                PublicTemplates.EmailConfirm
            ),
            passwordReset: MailerService._parseTemplate(
                templatesPath,
                PublicTemplates.PasswordReset
            )
        };
    }

    // --- Static -------------------------------------------------------------
    // --- Private --------------------
    //--- _parseTemplate -----------
    private static _parseTemplate(
        templatesPath: string,
        template: PublicTemplates
    ): Handlebars.TemplateDelegate<ITemplatedData> {
        const templateText = fs.readFileSync(
            path.join(templatesPath, template) + '.hbs',
            'utf-8'
        );
        return Handlebars.compile<ITemplatedData>(templateText, {
            strict: true
        });
    }

    // --- Instance -------------------------------------------------------------

    // --- Public --------------------

    //--- sendEmailConfirmation -----------
    public async sendEmailConfirmation(
        user: IUser,
        token: string
    ): Promise<void> {
        const { email, username: name } = user;

        this._logger.log('Sending a new confirmation email...');
        this._logger.debug({ user, token });

        const subject = 'Confirm your email';
        const html: string = this._templates.confirmation({
            name,
            link: `${this._env.frontEndDomain}/auth/confirm/${token}`
        });

        this._logger.debug({ subject, html });

        await this._sendEmail(email, subject, html);
    }

    //--- sendResetPasswordEmail -----------
    public async sendResetPasswordEmail(
        user: IUser,
        token: string
    ): Promise<void> {
        const { email, username: name } = user;

        this._logger.log('Sending a new password reset email...');
        this._logger.debug({ user, token });

        const subject = 'Reset your password';
        const html: string = this._templates.passwordReset({
            name,
            link: `${this._env.frontEndDomain}/auth/reset-password/${token}`
        });

        this._logger.debug({ subject, html });

        await this._sendEmail(email, subject, html);
    }

    // --- Private --------------------
    //--- _sendEmail -----------
    private async _sendEmail(
        to: string,
        subject: string,
        html: string
    ): Promise<void> {
        this._logger.debug(to, subject, html);
        await this._transport.sendMail({
            from: this._email.credentials.username,
            to,
            subject,
            html
        });
    }
}

export { MailerService };
