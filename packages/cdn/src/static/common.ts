import * as path from 'path';
import * as process from 'process';

const PORT = 5000;

const ASSETS_DIR = 'assets';
const ASSETS_ROOT = path.join(process.cwd(), '../../..', ASSETS_DIR);
const FILE_MAX_SIZE_MB = 5;
const FILE_EXT_REGEX = /^(jp(e)?g|png)$/;

export { PORT, ASSETS_DIR, ASSETS_ROOT, FILE_MAX_SIZE_MB, FILE_EXT_REGEX };
