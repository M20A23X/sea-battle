import * as path from 'path';
import * as process from 'process';

import { getEnvString } from '#shared/utils';

import { IConfig } from '#/types';
import { Config } from '#/static';

const joinPublicPath = (...dirs: string[]) => path.join(...dirs);

export default (): Pick<IConfig, 'assets'> => {
    const publicDir: string = getEnvString(
        'PUBLIC_DIR',
        Config.public.public.dir
    );
    const publicPath: string = joinPublicPath(process.cwd(), publicDir);

    const templatesDir: string = getEnvString(
        'TEMPLATES_DIR',
        Config.public.templates.dir
    );

    return {
        assets: {
            public: { dir: publicDir, path: publicPath },
            templates: {
                dir: templatesDir,
                path: joinPublicPath(publicPath, templatesDir)
            }
        }
    };
};
