import { Response } from 'express';

import {
    ControllerRes,
    Operation,
    ServiceCode,
    ServicePromiseRes,
    ServiceRes,
} from 'shared/types/requestResponse';

import { decipherError } from './decipherError.util';

import { SERVICE_CODE_STATUS_DICT } from 'static/web';

import { ILoggerService } from 'services/logger.service';

type Message = string | Record<string, any>;

type SuccessProps<P> = Partial<Pick<ServiceRes<P>, 'payload'>>;
type ErrorProps = { error: unknown };

type Props<P> = (SuccessProps<P> | ErrorProps) &
    Partial<Pick<ServiceRes, 'serviceCode'>> & { messageRaw?: Message };

const concatResMessage = (
    isSuccess: boolean,
    operation: Operation,
    entityName: string,
    message: string,
): string => {
    let msg: string = [
        isSuccess ? 'Successfully' : 'Error',
        ...operation.toLowerCase().split('_'),
        entityName.concat('s').toLowerCase(),
    ].join(' ');

    if (message.length) msg = msg.concat(': ').concat(message);
    msg = msg.concat(isSuccess ? '' : '!');
    return msg;
};

const getResMessage = (
    messageRaw: Message | undefined,
    error: unknown,
    serviceCode: ServiceCode | undefined,
    entityName: string,
    logger?: ILoggerService,
): string => {
    let message = '';

    if (typeof messageRaw === 'object') {
        message = Object.entries(messageRaw)
            .map(([key, value]) => key.concat(` '${value}'`))
            .join(', ');
    } else if (typeof messageRaw === 'string') message = messageRaw;

    const decipheredMsg: string = decipherError(
        entityName.toLowerCase(),
        logger,
        { error, serviceCode },
    );
    if (decipheredMsg.length) {
        message = decipheredMsg.concat(
            message.length ? ', '.concat(message) : '',
        );
    }

    return message;
};

const requireGetServiceRes = (entityName: string, logger?: ILoggerService) => {
    return (operation: Operation) => {
        return async <P>(props: Props<P>): ServicePromiseRes<P> => {
            const { serviceCode, messageRaw } = props || {};
            const { payload } = (props as SuccessProps<P>) || {};
            const { error } = (props as ErrorProps) || {};

            const serviceCodeRes: ServiceCode =
                error instanceof Error
                    ? 'UNEXPECTED_ERROR'
                    : serviceCode ?? 'SUCCESS';
            const isSuccess: boolean = serviceCodeRes === 'SUCCESS';
            const resMessage: string = getResMessage(
                messageRaw,
                error,
                serviceCode,
                entityName,
                logger,
            );

            if (!isSuccess && logger) {
                const warnMessage: string = concatResMessage(
                    isSuccess,
                    operation,
                    entityName,
                    resMessage,
                );
                logger.warn(warnMessage);
            }

            return {
                isSuccess,
                serviceCode: serviceCodeRes,
                operation,
                message: resMessage,
                payload: payload ?? null,
            };
        };
    };
};

const requireSendControllerRes = (entityName: string) => {
    return async <P>(
        serviceRes: ServiceRes<P>,
        res: Response,
    ): ControllerRes<P> => {
        const { isSuccess, serviceCode, operation, ...json } = serviceRes;

        json.message = concatResMessage(
            isSuccess,
            operation,
            entityName,
            json.message,
        );

        if (isSuccess) return res.json(json);
        return res.status(SERVICE_CODE_STATUS_DICT[serviceCode]).json(json);
    };
};

export type { Message };
export {
    concatResMessage,
    getResMessage,
    requireGetServiceRes,
    requireSendControllerRes,
};
