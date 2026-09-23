import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

import { SALARY_MONTH_PATTERN } from '../employee-salary-rules.js';

export class SalaryMonthQueryDto {
  @ApiPropertyOptional({
    type: String,
    example: '2026-09',
    description: 'Hangi ayın maaşı (`YYYY-MM`); verilmezse bu ay (UTC).',
  })
  @IsOptional()
  @Matches(SALARY_MONTH_PATTERN, { message: 'month must be a month in YYYY-MM format' })
  month?: string;
}
