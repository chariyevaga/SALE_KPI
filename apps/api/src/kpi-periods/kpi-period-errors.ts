import { ConflictException } from '@nestjs/common';

/**
 * Machine-readable `code` values of KPI period errors. The web client translates them;
 * the English `message` is technical and never shown to users (kpi-template-errors.ts).
 */
export const KPI_PERIOD_ERROR_CODES = ['KPI_PERIOD_CLOSED'] as const;

export type KpiPeriodErrorCode = (typeof KPI_PERIOD_ERROR_CODES)[number];

/** A closed period no longer accepts plans or targets (ADR-039). */
export function kpiPeriodClosed(label: string): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `KPI period ${label} is closed.`,
    code: 'KPI_PERIOD_CLOSED',
    period: label,
  });
}
