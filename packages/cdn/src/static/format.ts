import { FILE_MAX_SIZE_MB, FILE_EXT_REGEX } from './common';

export const FORMAT = {
    resourceSchema: {
        path: {
            format: /^(.+)\/([^\/]+)$/,
            errorMessage: 'path should be valid file path',
        },
        asset: {
            errorMessage: `File should have '${FILE_EXT_REGEX}' extension and should be not greater than ${FILE_MAX_SIZE_MB}`,
        },
    },
};

export const { resourceSchema: RESOURCE_FORMAT } = FORMAT;
