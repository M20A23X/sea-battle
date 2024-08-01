import * as http from 'http';
import { GeneralConfig } from '#/configs';

http.get(`https://127.0.0.1:${GeneralConfig().env.port}`);
