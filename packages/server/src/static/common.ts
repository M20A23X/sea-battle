import { Algorithm } from 'jsonwebtoken';

const DATABASE_NAME = 'games';
const DATABASE_IP = '127.0.0.1';
const DATABASE_PORT = 3306;
const PORT = 5000;
const WS_PORT = 8081;
const REFRESH_TOKEN_EXPIRE_TIME_MS = 7_776_000_000;
const JWT_EXPIRE_TIME_S = 3600;
const JWT_ALGORITHM: Algorithm = 'HS256';
const DATABASE_HEALTHCHECK_TIMEOUT_MS = 300;
const DISK_THRESHOLD_PERCENT = 0.85;
const MEM_HEAP_THRESHOLD = 1024 ** 3;
const MEM_RSS_THRESHOLD = 1024 ** 3;

const NODE_ENV_PROD = 'prod';

export {
    DATABASE_IP,
    DATABASE_NAME,
    DATABASE_PORT,
    PORT,
    WS_PORT,
    REFRESH_TOKEN_EXPIRE_TIME_MS,
    JWT_EXPIRE_TIME_S,
    JWT_ALGORITHM,
    DATABASE_HEALTHCHECK_TIMEOUT_MS,
    DISK_THRESHOLD_PERCENT,
    MEM_HEAP_THRESHOLD,
    MEM_RSS_THRESHOLD,
    NODE_ENV_PROD,
};
