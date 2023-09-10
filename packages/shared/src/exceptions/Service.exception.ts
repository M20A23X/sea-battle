import { ResPayload, ServiceCode } from 'types/requestResponse';

export class ServiceException extends Error {
    public readonly code: ServiceCode;
    public readonly operation: string;
    public readonly context: string;
    public readonly entity: string;
    public readonly payload: ResPayload;

    constructor(
        operation: string,
        context: string,
        entity: string,
        payload: ResPayload = undefined,
        serviceCode: ServiceCode = 'UNEXPECTED_ERROR',
    ) {
        super(serviceCode);
        this.operation = operation;
        this.code = serviceCode;
        this.context = context;
        this.entity = entity;
        this.payload = payload;
    }
}
