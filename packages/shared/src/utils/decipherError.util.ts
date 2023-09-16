import { MessagePayload, ServiceCode } from '../types';
import { SERVICE_CODE_MESSAGE_DICT } from '../static';

const stringifyMsgPayload = (payloadRaw: MessagePayload, sep = '') => {
    let payload = '';

    if (typeof payloadRaw === 'string') payload = payloadRaw;
    else if (typeof payloadRaw === 'object')
        payload = Object.entries(payloadRaw)
            .map(([key, value]) => `${key}${sep} '${value}'`)
            .join(', ');

    return payload;
};

const decipherCode = (
    contextEntity: string,
    serviceCode: ServiceCode,
    payloadRaw: MessagePayload
): string => {
    let message = '';
    const isDefined: boolean = Object.keys(SERVICE_CODE_MESSAGE_DICT).includes(
        serviceCode
    );
    if (isDefined)
        message = SERVICE_CODE_MESSAGE_DICT[serviceCode](contextEntity);
    if (payloadRaw)
        message = message.concat(', ').concat(stringifyMsgPayload(payloadRaw));
    return message;
};

export { stringifyMsgPayload, decipherCode };
