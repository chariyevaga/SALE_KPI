import { ConflictException } from '@nestjs/common';

/**
 * Machine-readable `code` values of KPI period errors. The web client translates them;
 * the English `message` is technical and never shown to users (kpi-template-errors.ts).
 */
export const KPI_PERIOD_ERROR_CODES = [
  'KPI_PERIOD_CLOSED',
  'KPI_PERIOD_OPEN',
  'KPI_PERIOD_REOPEN_EXPIRED',
] as const;

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

/** Only a closed period can be reopened. */
export function kpiPeriodAlreadyOpen(label: string): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `KPI period ${label} is already open.`,
    code: 'KPI_PERIOD_OPEN',
    period: label,
  });
}

/** Past the reopen window the closing is final (ADR-044). */
export function kpiPeriodReopenExpired(label: string, reopenableUntil: string): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `KPI period ${label} could be reopened until ${reopenableUntil}.`,
    code: 'KPI_PERIOD_REOPEN_EXPIRED',
    period: label,
    reopenableUntil,
  });
}
