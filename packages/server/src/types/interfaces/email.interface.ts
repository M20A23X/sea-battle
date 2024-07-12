import { IPassword, IUsername } from '#shared/types/interfaces';

interface IEmailCredentials extends IPassword, IUsername {}

interface IEmailConfig {
    host: string;
    port: number;
    secure: boolean;
    credentials: IEmailCredentials;
}

type IEmailConfigDefault = Omit<IEmailConfig, 'credentials'>;

export { IEmailCredentials, IEmailConfig, IEmailConfigDefault };
