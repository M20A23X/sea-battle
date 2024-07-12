import * as http from 'http';
import { EnvConfig } from '#/configs';

http.get(`https://127.0.0.1:${EnvConfig().env.port}`);
