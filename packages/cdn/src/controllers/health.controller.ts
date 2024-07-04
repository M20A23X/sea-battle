import * as path from 'path';
import { Controller, Get, HttpStatus } from '@nestjs/common';
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

import { IEnvConfig, IHealthConfig, Res } from '#shared/types';
import { Exception } from '#shared/exceptions';
import { Default as DefaultShared, MimeType } from '#shared/static';

import { Default } from '#/static';

export interface IHealthController {
    get(): Res<string>;

    getCheckHealth(): Res<HealthCheckResult | unknown>;
}

@Controller('/health')
export class HealthController implements IHealthController {
    private readonly _health: IHealthConfig['health'] = DefaultShared.health;
    private readonly _env: IEnvConfig['env'] = Default.env;

    constructor(
        private readonly _configService: ConfigService<
            IHealthConfig & IEnvConfig
        >,
        private readonly _healthServices: HealthCheckService,
        private readonly _httpIndicator: HttpHealthIndicator,
        private readonly _diskIndicator: DiskHealthIndicator,
        private readonly _memoryIndicator: MemoryHealthIndicator
    ) {
        this._health = this._configService.getOrThrow('health');
        this._env = this._configService.getOrThrow('env');
    }

    @Get('/check')
    @ApiOperation({ summary: 'Check' })
    @ApiProduces(MimeType.ApplicationJson)
    async get(): Res<string> {
        return { message: 'Check', payload: 'payload' };
    }

    @Get('/')
    @ApiOperation({ summary: 'Check CDN health' })
    @ApiProduces(MimeType.ApplicationJson)
    @HealthCheck()
    async getCheckHealth(): Res<HealthCheckResult> {
        const { diskThreshold, memRSSThreshold, memHeapThreshold } =
            this._health;

        try {
            const healthRes: HealthCheckResult =
                await this._healthServices.check([
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
                            thresholdPercent: diskThreshold
                        }),
                    () =>
                        this._memoryIndicator.checkRSS(
                            'memory RSS',
                            memRSSThreshold
                        ),
                    () =>
                        this._memoryIndicator.checkHeap(
                            'memory Heap',
                            memHeapThreshold
                        )
                ]);
            return {
                message: 'Successfully got health status',
                payload: healthRes
            };
        } catch (error: unknown) {
            throw new Exception('UNHEALTHY');
        }
    }
}
