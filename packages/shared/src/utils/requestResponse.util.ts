import { Request } from 'express';
import { QueryError } from 'mysql2';
import { ConsoleLogger } from '@nestjs/common';

import { Operation, PromiseRes, MessagePayload, ServiceCode } from '#/types';

import { ServiceException } from '#/exceptions';

import { stringifyMsgPayload } from '#/utils';

type GetSuccessRes = <P = void>(
    resPayload?: MessagePayload,
    payload?: P,
    entity?: string
) => PromiseRes<P>;
type GetUnSuccessRes = (
    serviceCode?: ServiceCode,
    resPayload?: MessagePayload,
    entity?: string
) => ServiceException;

const getContextEntity = (context: string): string => {
    const entityLastChar: number = context.search(/[A-Za-z][A-Z][a-z]/);
    return context.slice(0, entityLastChar + 1);
};

const getServiceCode = (error: unknown): ServiceCode | undefined =>
    (error as QueryError)?.code as ServiceCode;

const logRequestInfo = (logger: ConsoleLogger, req: Request): void => {
    const { ip, method, originalUrl, httpVersion } = req;
    const reqString = stringifyMsgPayload(
        {
            ip,
            method,
            originalUrl,
            httpVersion
        },
        ':'
    );
    logger.log.call(logger, reqString);
};

const requireGetRes = (serviceContext: string) => {
    return (
        operationCode: Operation,
        methodEntity?: string
    ): [GetSuccessRes, GetUnSuccessRes] => {
        const operation = operationCode
            .toLowerCase()
            .split('_')
            .join(' ')
            .toLowerCase();
        const contextEntity0: string =
            methodEntity ?? getContextEntity(serviceContext);

        const getSuccessRes = async <P = void>(
            resPayload: MessagePayload = undefined,
            payload?: P,
            entity?: string
        ): PromiseRes<P> => {
            const contextEntity1: string = (
                entity ?? contextEntity0
            ).toLowerCase();
            let message = `Successfully ${operation} ${contextEntity1}s`;
            if (resPayload)
                message = message
                    .concat(', ')
                    .concat(stringifyMsgPayload(resPayload));

            if (payload) return { message, payload } as any;
            return { message } as any;
        };
        const getUnSuccessRes = (
            serviceCode: ServiceCode = 'UNEXPECTED_ERROR',
            resPayload: MessagePayload = undefined,
            entity?: string
        ): ServiceException => {
            const contextEntity1: string = (
                entity ?? contextEntity0
            ).toLowerCase();
            return new ServiceException(
                operation,
                serviceContext,
                contextEntity1,
                resPayload,
                serviceCode
            );
        };

        return [getSuccessRes, getUnSuccessRes];
    };
};

export type { GetSuccessRes, GetUnSuccessRes };
export { getContextEntity, getServiceCode, logRequestInfo, requireGetRes };
