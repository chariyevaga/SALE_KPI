import type { KpiPeriodStatus } from './entities/kpi-period.entity.js';

/** KPI periods are monthly (docs/BUSINESS_RULES.md "KPI dönemi"). */
export const MIN_PERIOD_YEAR = 2000;
export const MAX_PERIOD_YEAR = 2100;

export interface PeriodMonth {
  year: number;
  month: number;
}

/** `2026-09`: how a period is named in responses, logs and screens. */
export function periodLabel({ year, month }: PeriodMonth): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
}

/** Sort key of a period; periods are listed newest first. */
export function periodOrder({ year, month }: PeriodMonth): number {
  return year * 12 + (month - 1);
}

export function isPeriodOpen(period: { status: KpiPeriodStatus }): boolean {
  return period.status === 'open';
}

/** Days after the end of its month during which a closed period can still be reopened. */
export const REOPEN_GRACE_DAYS = 10;

/**
 * First moment a closed period can no longer be reopened (ADR-044): the end of the
 * REOPEN_GRACE_DAYS-th day of the following month, in UTC. October 2026 can be reopened
 * through 10 November 2026.
 */
export function reopenDeadline({ year, month }: PeriodMonth): Date {
  // Date.UTC takes a zero-based month, so `month` is already the following month.
  return new Date(Date.UTC(year, month, REOPEN_GRACE_DAYS + 1));
}

/** The last day a closed period can be reopened, `YYYY-MM-DD`. */
export function reopenableUntil(period: PeriodMonth): string {
  const lastDay = new Date(reopenDeadline(period).getTime() - 24 * 60 * 60 * 1000);

  return lastDay.toISOString().slice(0, 10);
}

export function canReopenPeriod(
  period: PeriodMonth & { status: KpiPeriodStatus },
  now: Date,
): boolean {
  return !isPeriodOpen(period) && now < reopenDeadline(period);
}

/** The month before the given one, e.g. for "copy last month's plans". */
export function previousMonth({ year, month }: PeriodMonth): PeriodMonth {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
