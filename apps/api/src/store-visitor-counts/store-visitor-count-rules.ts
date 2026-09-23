import type { PeriodMonth } from '../kpi-periods/kpi-period-rules.js';

/** Upper bound of a day's count; the table's CHECK constraint holds the same number. */
export const MAX_VISITOR_COUNT = 1_000_000;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The KPI period (month) a visit date belongs to. */
export function visitMonth(date: string): PeriodMonth {
  const [year, month] = date.split('-').map(Number);

  return { year: year ?? 0, month: month ?? 0 };
}

/**
 * A count can only be entered for a day that has started somewhere the stores might be.
 * Dates are compared in UTC with one day of slack, so "today" in Ashgabat (UTC+5) is
 * accepted all day while the server runs in UTC; a later date is rejected.
 */
export function isFutureVisitDate(date: string, now: Date): boolean {
  const latestAllowed = new Date(now.getTime() + DAY_MS).toISOString().slice(0, 10);

  return date > latestAllowed;
}
