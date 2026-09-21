import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

import { KPI_PERIOD_STATUSES, type KpiPeriodStatus } from '../entities/kpi-period.entity.js';
import { MAX_PERIOD_YEAR, MIN_PERIOD_YEAR } from '../kpi-period-rules.js';

export class SaveKpiPeriodDto {
  @ApiProperty({ type: Number, minimum: MIN_PERIOD_YEAR, maximum: MAX_PERIOD_YEAR, example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PERIOD_YEAR)
  @Max(MAX_PERIOD_YEAR)
  year: number;

  @ApiProperty({ type: Number, minimum: 1, maximum: 12, example: 9 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class ListKpiPeriodsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 24, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ type: String, enum: KPI_PERIOD_STATUSES, description: 'Durum filtresi.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(KPI_PERIOD_STATUSES)
  status?: KpiPeriodStatus;
}
