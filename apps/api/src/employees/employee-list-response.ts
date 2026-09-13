import { ApiProperty } from '@nestjs/swagger';

import { EmployeeResponse } from './employee-response.js';

export class EmployeeListResponse {
  @ApiProperty({ type: () => EmployeeResponse, isArray: true })
  items: EmployeeResponse[];

  @ApiProperty({ type: Number, description: 'Filtreye uyan toplam kayıt sayısı.' })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}
