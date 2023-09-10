import { Request } from 'express';
import { QueryError } from 'mysql2';
import { ConsoleLogger } from '@nestjs/common';

import { ServiceException } from '../exceptions/Service.exception';

import { stringifyResPayload } from './decipherError.util';
import {
    Operation,
    PromiseRes,
    ResPayload,
    ServiceCode,
} from 'types/requestResponse';

type GetSuccessRes = <P>(
    resPayload?: ResPayload,
    payload?: P,
    entity?: string,
) => PromiseRes<P>;
type GetUnSuccessRes = (
    serviceCode?: ServiceCode,
    resPayload?: ResPayload,
    entity?: string,
) => ServiceException;

const getContextEntity = (context: string): string => {
    const entityLastChar: number = context.search(/[A-Za-z][A-Z][a-z]/);
    return context.slice(0, entityLastChar + 1);
};

const getQuery = <T extends object>(dto: T) =>
    Object.entries(dto)
        .map(([key, value]) => key.concat('=').concat(value))
        .join('&');

const getServiceCode = (error: unknown): ServiceCode | undefined =>
    (error as QueryError)?.code as ServiceCode;

const logRequestInfo = (logger: ConsoleLogger, req: Request): void => {
    const reqString = JSON.stringify({
        remoteAddress: req.ip,
        method: req.method,
        url: req.url,
        httpVersion: req.httpVersionMinor,
    });
    logger.log.call(logger, reqString);
};

const requireGetRes = (serviceContext: string) => {
    return (
        operationCode: Operation,
        methodEntity?: string,
    ): [GetSuccessRes, GetUnSuccessRes] => {
        const operation = operationCode
            .toLowerCase()
            .split('_')
            .join(' ')
            .toLowerCase();
        const contextEntity0: string =
            methodEntity ?? getContextEntity(serviceContext);

        const getSuccessRes = async <P>(
            resPayload: ResPayload = undefined,
            payload?: P,
            entity?: string,
        ): PromiseRes<P> => {
            const contextEntity1: string = (
                entity ?? contextEntity0
            ).toLowerCase();
            let message = `Successfully ${operation} ${contextEntity1}s`;
            if (resPayload)
                message = message
                    .concat(', ')
                    .concat(stringifyResPayload(resPayload));
            return { message, payload: payload ?? null };
        };
        const getUnSuccessRes = (
            serviceCode: ServiceCode = 'UNEXPECTED_ERROR',
            resPayload: ResPayload = undefined,
            entity?: string,
        ): ServiceException => {
            const contextEntity1: string = (
                entity ?? contextEntity0
            ).toLowerCase();
            return new ServiceException(
                operation,
                serviceContext,
                contextEntity1,
                resPayload,
                serviceCode,
            );
        };

        return [getSuccessRes, getUnSuccessRes];
    };
};

export {
    getContextEntity,
    getQuery,
    getServiceCode,
    logRequestInfo,
    requireGetRes,
};
