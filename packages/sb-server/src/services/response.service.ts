import { Request } from 'express';
import { QueryError } from 'mysql2';
import { TResponse } from 'types/requestResponse';

import { ILoggerService, LoggerService } from 'services/logger.service';

import { DATABASE } from 'static/database';

export type TCrudType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
type TErrorCode = 'INCORRECT_PASSWORD' | 'DOESNT_EXIST';

export interface IResponseService {
    getSuccessRes<P>(
        crudType: TCrudType,
        payload?: Record<string, any>,
        resPayload?: P,
    ): TResponse<P>;

    getWarnRes<P>(
        crudType: TCrudType,
        context: TErrorCode | unknown | '',
        payload?: Record<string, any>,
    ): TResponse<P>;
}

export class ResponseService implements IResponseService {
    constructor(context: string) {
        this._entityName = context.match(/^(.+)[A-Z]/)?.[1].toLowerCase() || '';
        this._loggerService = new LoggerService(context);
    }

    ///--- Private ---///
    private readonly _entityName: string;
    private readonly _loggerService: ILoggerService;

    ///--- Private ---///
    public getSuccessRes<P>(
        crudType: TCrudType,
        payload?: Record<string, any>,
        resPayload?: P,
    ): TResponse<P> {
        let payloadMsg = '';
        const crudMsg = crudType ? crudType.toLowerCase() + ' ' : '';
        if (typeof payload === 'object') {
            const payloadKey = Object.keys(payload)[0];
            payloadMsg = `, ${payloadKey} '${payload[payloadKey]}'`;
        }

        const message = `Success ${crudMsg}${this._entityName}${payloadMsg}`;
        return {
            message,
            payload: resPayload || null,
        };
    }

    public getWarnRes<P>(
        crudType: TCrudType,
        context: TErrorCode | unknown | '',
        payload?: Record<string, any>,
    ): TResponse<P> {
        const crudMsg = crudType ? crudType.toLowerCase() + ' ' : '';
        let contextMessage: string;
        let errMsg = '';
        let errCode = '';

        if (context instanceof Error) {
            errMsg = context.message;
            errCode = (context as QueryError)?.code;
            this._loggerService.debug(context.stack);
        }
        switch (errCode) {
            case 'ER_DUP_ENTRY': {
                const [record, constraint] =
                    errMsg.match(/'(\\.|[^'\\])*'/g) || [];
                const dupFieldName = constraint
                    .match(/UQ_(.+)/)?.[1]
                    .slice(0, -1);
                contextMessage = `record with ${dupFieldName} '${record}' already exists`;
                break;
            }
            case 'ER_DATA_TOO_LONG': {
                const dataFieldName =
                    errMsg.match(/'(\\.|[^'\\])*'/g)?.[0].slice(1, -1) || '';
                const fieldMaxLength =
                    DATABASE[this._entityName + 'Schema']?.[dataFieldName]
                        ?.maxLength;
                contextMessage = `'${dataFieldName}' must be not greater than ${fieldMaxLength} symbols`;
                break;
            }
            case 'ER_NO_REFERENCED_ROW_2': {
                contextMessage = `referenced record doesn't exist`;
                break;
            }
            default:
                let msg = '';
                if (typeof context === 'string' && context.trim().length) {
                    msg += ': ';
                    const isCustomMessage: boolean = /[a-z]/.test(context);
                    if (isCustomMessage) msg = context;
                    else msg = context.split('_').join(' ').toLowerCase();
                }
                contextMessage = msg;
                break;
        }

        contextMessage = contextMessage.length ? ': ' + contextMessage : '';
        let message = `Error ${crudMsg}${this._entityName}${contextMessage}`;
        if (typeof payload === 'object') {
            message += Object.entries(payload).reduce(
                (result, [key, value]) => `, ${key} '${value}'`,
                '',
            );
        }

        message += '!';
        this._loggerService.warn(message);
        return {
            message,
            payload: null,
        };
    }

    public logRequestInfo(req: Request): void {
        this._loggerService.log(
            `Request: ${JSON.stringify({
                remoteAddress: req.ip,
                method: req.method,
                url: req.url,
                httpVersion: req.httpVersionMinor,
            })}`,
        );
    }
}
