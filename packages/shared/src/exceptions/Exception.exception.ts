import { ServiceCode } from '#/types';
import { Web } from '#/static';

class Exception extends Error {
    public readonly code: ServiceCode;
    public readonly entity?: string;

    constructor(serviceCode: ServiceCode, entity?: string) {
        super(Web.codeMessageDict[serviceCode](entity) + '!');
        this.code = serviceCode;
        this.entity = entity;
    }
}

export { Exception };
