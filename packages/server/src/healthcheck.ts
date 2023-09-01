import * as http from 'http';
import process from 'process';
import { PORT } from 'static/common';

http.get(`https:///127.0.0.1:${process.env.SERVER_PORT_HTTP || PORT}`);
