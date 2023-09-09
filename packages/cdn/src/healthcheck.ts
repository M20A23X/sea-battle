import * as http from 'http';
import * as process from 'process';
import { PORT } from 'static/common';

http.get(`https:///127.0.0.1:${process.env.CDN_PORT || PORT}`);
