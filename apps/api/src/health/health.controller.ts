import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthResponse, HealthService } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'API process liveness kontrolü.' })
  @ApiOkResponse({ type: HealthResponse })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
