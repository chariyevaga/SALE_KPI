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

/** The month before the given one, e.g. for "copy last month's plans". */
export function previousMonth({ year, month }: PeriodMonth): PeriodMonth {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
