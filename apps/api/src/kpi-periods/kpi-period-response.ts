import { ApiProperty } from '@nestjs/swagger';

import {
  KPI_PERIOD_STATUSES,
  type KpiPeriodEntity,
  type KpiPeriodStatus,
} from './entities/kpi-period.entity.js';
import { KPI_PERIOD_ERROR_CODES, type KpiPeriodErrorCode } from './kpi-period-errors.js';
import { canReopenPeriod, periodLabel, reopenableUntil } from './kpi-period-rules.js';

/** Plan counts of a period; both come from one grouped query for the whole page. */
export interface KpiPeriodPlanStats {
  assignmentCount: number;
  missingTargetCount: number;
}

export class KpiPeriodResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number, example: 2026 })
  year: number;

  @ApiProperty({ type: Number, example: 9 })
  month: number;

  @ApiProperty({ type: String, example: '2026-09' })
  label: string;

  @ApiProperty({ type: String, enum: KPI_PERIOD_STATUSES })
  status: KpiPeriodStatus;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  closedAt: Date | null;

  @ApiProperty({
    type: Boolean,
    description:
      'Kapalı dönem şu an yeniden açılabiliyorsa `true` (ADR-044); açık dönemde `false`.',
  })
  canReopen: boolean;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-10-10',
    description: 'Kapalı dönemin yeniden açılabileceği son gün: ayın bitiminden sonraki 10. gün.',
  })
  reopenableUntil: string;

  @ApiProperty({ type: Number, example: 8, description: 'Dönemdeki plan sayısı.' })
  assignmentCount: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'En az bir hedefi girilmemiş plan sayısı.',
  })
  missingTargetCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class KpiPeriodListResponse {
  @ApiProperty({ type: () => KpiPeriodResponse, isArray: true })
  items: KpiPeriodResponse[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}

export class KpiPeriodErrorResponse {
  @ApiProperty({ type: Number, example: 409 })
  statusCode: number;

  @ApiProperty({ type: String, example: 'Conflict' })
  error: string;

  @ApiProperty({ type: String, example: 'KPI period 2026-09 is closed.' })
  message: string;

  @ApiProperty({ type: String, enum: KPI_PERIOD_ERROR_CODES })
  code: KpiPeriodErrorCode;
}

export function toKpiPeriodResponse(
  period: KpiPeriodEntity,
  stats?: KpiPeriodPlanStats,
): KpiPeriodResponse {
  return {
    id: period.id,
    year: period.year,
    month: period.month,
    label: periodLabel(period),
    status: period.status,
    closedAt: period.closedAt,
    canReopen: canReopenPeriod(period, new Date()),
    reopenableUntil: reopenableUntil(period),
    assignmentCount: stats?.assignmentCount ?? 0,
    missingTargetCount: stats?.missingTargetCount ?? 0,
    createdAt: period.createdAt,
    updatedAt: period.updatedAt,
  };
}
