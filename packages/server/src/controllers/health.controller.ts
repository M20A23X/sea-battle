import path from 'path';
import {
    Controller,
    Get,
    HttpStatus,
    InternalServerErrorException
} from '@nestjs/common';
import { ApiOperation, ApiProduces } from '@nestjs/swagger';
import {
    DiskHealthIndicator,
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HttpHealthIndicator,
    MemoryHealthIndicator
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

import { IHealthController } from '#shared/types';
import {
    IEnvConfig,
    IHealthConfig,
    MimeType,
    Res
} from '#shared/types/interfaces';
import { IConfig } from '#/types';

@Controller('/health')
class HealthController implements IHealthController {
    // --- Configs -------------------------------------------------------------
    private readonly _health: IHealthConfig;
    private readonly _env: IEnvConfig;
    private readonly _services: {
        healthCheck: HealthCheckService;
        httpIndicator: HttpHealthIndicator;
        diskIndicator: DiskHealthIndicator;
        memoryIndicator: MemoryHealthIndicator;
    };

    // --- Constructor -------------------------------------------------------------
    constructor(
        private readonly _configService: ConfigService<IConfig>,
        private readonly _healthCheck: HealthCheckService,
        private readonly _httpIndicator: HttpHealthIndicator,
        private readonly _diskIndicator: DiskHealthIndicator,
        private readonly _memoryIndicator: MemoryHealthIndicator
    ) {
        this._health = this._configService.getOrThrow('health');
        this._env = this._configService.getOrThrow('env');

        this._services = {
            healthCheck: this._healthCheck,
            memoryIndicator: this._memoryIndicator,
            diskIndicator: this._diskIndicator,
            httpIndicator: this._httpIndicator
        };
    }

    // --- Public -------------------------------------------------------------
    // --- Instance --------------------

    //--- Get /check -----------
    @Get('/check')
    @ApiOperation({ summary: 'Check' })
    @ApiProduces(MimeType.ApplicationJson)
    async get(): Res<string> {
        return { message: 'Check', payload: 'payload' };
    }

    //--- Get / -----------
    @Get('/')
    @ApiOperation({ summary: 'Check CDN health' })
    @ApiProduces(MimeType.ApplicationJson)
    @HealthCheck()
    async getCheckHealth(): Res<HealthCheckResult> {
        try {
            const healthRes: HealthCheckResult = await this._healthCheck.check([
                () =>
                    this._httpIndicator.pingCheck(
                        'ping',
                        `http://127.0.0.1:${this._env.port}/health/check`
                    ),
                () =>
                    this._httpIndicator.responseCheck(
                        'response',
                        `http://127.0.0.1:${this._env.port}/health/check`,
                        (response) =>
                            [HttpStatus.OK, HttpStatus.CREATED].includes(
                                response.status
                            )
                    ),
                () =>
                    this._diskIndicator.checkStorage('storage', {
                        path: path.parse(process.cwd()).root,
                        thresholdPercent: this._health.diskThreshold
                    }),
                () =>
                    this._memoryIndicator.checkRSS(
                        'memory RSS',
                        this._health.memRSSThreshold
                    ),
                () =>
                    this._memoryIndicator.checkHeap(
                        'memory Heap',
                        this._health.memHeapThreshold
                    )
            ]);
            return {
                message: 'Successfully got the health status',
                payload: healthRes
            };
        } catch (error: unknown) {
            throw new InternalServerErrorException('unhealthy');
        }
    }
}

export { HealthController };
