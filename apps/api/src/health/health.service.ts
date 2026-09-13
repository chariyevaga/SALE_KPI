import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({ type: String, enum: ['ok'] })
  status: 'ok';

  @ApiProperty({ type: String, enum: ['api'] })
  service: 'api';

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: string;
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}
