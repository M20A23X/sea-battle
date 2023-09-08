import * as path from 'path';

import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import {
    DiskHealthIndicator,
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HttpHealthIndicator,
    MemoryHealthIndicator,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { ControllerRes } from 'shared/types/requestResponse';
import { ILoggerService, LoggerService } from 'services/logger.service';

import {
    DATABASE_HEALTHCHECK_TIMEOUT_MS,
    DISK_THRESHOLD_PERCENT,
    MEM_HEAP_THRESHOLD,
    MEM_RSS_THRESHOLD,
} from 'static/common';

export interface IHealthController {
    get(): ControllerRes<string>;
    getCheckHealth(): ControllerRes<HealthCheckResult | unknown>;
}

@Controller('/')
export class HealthController implements IHealthController {
    constructor(
        private _healthServices: HealthCheckService,
        private _httpIndicator: HttpHealthIndicator,
        private _diskIndicator: DiskHealthIndicator,
        private _memoryIndicator: MemoryHealthIndicator,
        private _dbIndicator: TypeOrmHealthIndicator,
    ) {}

    private readonly _loggerService: ILoggerService = new LoggerService(
        HealthController.name,
    );

    @Get('/')
    @ApiOperation({ summary: 'Check' })
    async get(): ControllerRes<string> {
        return { message: 'Check', payload: 'payload' };
    }

    @Get('/health')
    @ApiOperation({ summary: 'Check server health' })
    @HealthCheck()
    async getCheckHealth(): ControllerRes<HealthCheckResult | unknown> {
        try {
            const healthRes: HealthCheckResult =
                await this._healthServices.check([
                    () =>
                        this._httpIndicator.pingCheck(
                            'ping',
                            `http://127.0.0.1:${process.env.SERVER_PORT_HTTP}/`,
                        ),
                    () =>
                        this._httpIndicator.responseCheck(
                            'response',
                            `http://127.0.0.1:${process.env.SERVER_PORT_HTTP}/`,
                            (response) => [200, 201].includes(response.status),
                        ),
                    () =>
                        this._dbIndicator.pingCheck('database ping', {
                            timeout: DATABASE_HEALTHCHECK_TIMEOUT_MS,
                        }),
                    () =>
                        this._diskIndicator.checkStorage('storage', {
                            path: path.parse(process.cwd()).root,
                            thresholdPercent: DISK_THRESHOLD_PERCENT,
                        }),
                    () =>
                        this._memoryIndicator.checkRSS(
                            'memory',
                            MEM_RSS_THRESHOLD,
                        ),
                    () =>
                        this._memoryIndicator.checkHeap(
                            'memory',
                            MEM_HEAP_THRESHOLD,
                        ),
                ]);
            return {
                message: 'Successfully get health status',
                payload: healthRes,
            };
        } catch (error: unknown) {
            let message = 'Error check health!';
            if (error instanceof Error)
                message = `${message.slice(0, -1)}: ${error.message}`;
            this._loggerService.warn(message);
            return { message, payload: error };
        }
    }
}
