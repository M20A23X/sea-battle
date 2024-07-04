import { Default as DefaultShared } from '#shared/static';

type SchemaEntry = 'path';
type Format = {
    [K in SchemaEntry]: {
        format: RegExp;
        errorMessage: string;
    };
};

const Format: Format = {
    path: {
        format: DefaultShared.file.path.regex,
        errorMessage: `path should contain only '${DefaultShared.file.path.allowedChars}' symbols`
    }
};

export { Format };
