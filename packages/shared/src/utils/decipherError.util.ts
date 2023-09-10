import { SERVICE_CODE_MESSAGE_DICT } from '../static/web';
import { ResPayload, ServiceCode } from 'types/requestResponse';

const stringifyResPayload = (payloadRaw: ResPayload) => {
    let payload = '';

    if (typeof payloadRaw === 'string') payload = payloadRaw;
    else if (typeof payloadRaw === 'object')
        payload = Object.entries(payloadRaw)
            .map(([key, value]) => key.concat(` '${value}'`))
            .join(', ');

    return payload;
};

const decipherCode = (
    contextEntity: string,
    serviceCode: ServiceCode,
    payloadRaw: ResPayload,
): string => {
    let message = '';
    const isDefined: boolean = Object.keys(SERVICE_CODE_MESSAGE_DICT).includes(
        serviceCode,
    );
    if (isDefined)
        message = SERVICE_CODE_MESSAGE_DICT[serviceCode](contextEntity);
    if (payloadRaw)
        message = message.concat(', ').concat(stringifyResPayload(payloadRaw));
    return message;
};

export { stringifyResPayload, decipherCode };
