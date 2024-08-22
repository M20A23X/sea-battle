import { HealthCheckResult } from '@nestjs/terminus';
import { Res } from '#/types/interfaces';

interface IHealthController {
    get(): Res<string>;

    getCheckHealth(): Res<HealthCheckResult | unknown>;
}

export { IHealthController };
