/**
 * Rules of the store dashboard (ADR-061): which KPIs it shows, which months it keeps fresh,
 * and how a calendar year is compared with the year before, month by month.
 */

/** The store KPIs #1–#6; conversion and item group sales need inputs the dashboard has not. */
export const STORE_DASHBOARD_KPI_CODES = [
  'STORE_SALES',
  'STORE_RECEIPTS',
  'STORE_CUSTOMERS',
  'STORE_NEW_CUSTOMERS',
  'STORE_RETURNING_CUSTOMERS',
  'STORE_PRODUCT_VARIETY',
] as const;

export type StoreDashboardKpiCode = (typeof STORE_DASHBOARD_KPI_CODES)[number];

/**
 * How the months of a period add up. Sales, receipts and new customers add up exactly (a
 * customer is new once in the firm's history). Customers, returning customers and product
 * variety are distinct per month, so their sum would count the same customer or item again;
 * the period shows their monthly average. Growth is the same either way, because both years
 * are compared over the same months.
 */
export const STORE_DASHBOARD_AGGREGATION = {
  STORE_SALES: 'sum',
  STORE_RECEIPTS: 'sum',
  STORE_CUSTOMERS: 'average',
  STORE_NEW_CUSTOMERS: 'sum',
  STORE_RETURNING_CUSTOMERS: 'average',
  STORE_PRODUCT_VARIETY: 'average',
} as const satisfies Record<StoreDashboardKpiCode, 'sum' | 'average'>;

export type StoreDashboardAggregation = 'sum' | 'average';

export const MONTH_STATUSES = ['complete', 'inProgress', 'upcoming'] as const;

export type MonthStatus = (typeof MONTH_STATUSES)[number];

/** One value of `dbo.kpi_month_values` for a store. */
export interface StoreMonthValue {
  storeNr: number;
  /** `YYYY-MM-01`. */
  monthStart: string;
  kpiCode: string;
  currency: string | null;
  value: number;
}

export interface StoredStoreMonthValue extends StoreMonthValue {
  id: string;
}

export interface MonthComparison {
  /** 1–12. */
  month: number;
  status: MonthStatus;
  /** The selected year; null when the store had no sales documents that month. */
  current: number | null;
  /** The year before. */
  previous: number | null;
  /** Only for a finished month with a positive value the year before. */
  growthPercent: number | null;
}

export interface ComparisonSummary {
  /** Finished months with values in both years; the growth is measured over these. */
  comparableMonths: number[];
  current: number | null;
  previous: number | null;
  difference: number | null;
  growthPercent: number | null;
  /** Every finished month of the selected year that has a value. */
  currentYearValue: number | null;
  currentYearMonths: number;
  /** Every month of the year before that has a value. */
  previousYearValue: number | null;
  previousYearMonths: number;
}

export interface SeriesComparison {
  months: MonthComparison[];
  summary: ComparisonSummary;
}

/** The months every refresh rewrites: January of last year through the current month. */
export function refreshWindow(today: string): { from: string; to: string } {
  const year = Number(today.slice(0, 4));

  return { from: `${String(year - 1)}-01-01`, to: `${today.slice(0, 7)}-01` };
}

/** `YYYY-MM` of a year and month. */
export function monthKey(year: number, month: number): string {
  return `${String(year)}-${String(month).padStart(2, '0')}`;
}

/** Whether a month has ended, is running (`currentMonth`, `YYYY-MM`) or lies ahead. */
export function monthStatus(year: number, month: number, currentMonth: string): MonthStatus {
  const key = monthKey(year, month);

  if (key < currentMonth) {
    return 'complete';
  }

  return key === currentMonth ? 'inProgress' : 'upcoming';
}

/** Change from `previous` to `current` in percent, one decimal; null without a positive base. */
export function growthPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function aggregate(values: number[], aggregation: StoreDashboardAggregation): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return aggregation === 'sum' ? total : total / values.length;
}

/**
 * Compares `year` with the year before, month by month. `values` holds one value per month
 * (`YYYY-MM`); a missing month had no sales documents. The running month is shown but never
 * compared or counted: it is only partly over.
 */
export function compareYears(
  values: ReadonlyMap<string, number>,
  year: number,
  currentMonth: string,
  aggregation: StoreDashboardAggregation,
): SeriesComparison {
  const months: MonthComparison[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const status = monthStatus(year, month, currentMonth);
    const current = status === 'upcoming' ? null : (values.get(monthKey(year, month)) ?? null);
    const previous = values.get(monthKey(year - 1, month)) ?? null;

    months.push({
      month,
      status,
      current,
      previous,
      growthPercent: status === 'complete' ? growthPercent(current, previous) : null,
    });
  }

  const comparable = months.filter(
    (entry) => entry.status === 'complete' && entry.current !== null && entry.previous !== null,
  );
  const current = aggregate(
    comparable.map((entry) => entry.current ?? 0),
    aggregation,
  );
  const previous = aggregate(
    comparable.map((entry) => entry.previous ?? 0),
    aggregation,
  );
  const finished = months.filter((entry) => entry.status === 'complete' && entry.current !== null);
  const previousYear = months.filter((entry) => entry.previous !== null);

  return {
    months,
    summary: {
      comparableMonths: comparable.map((entry) => entry.month),
      current,
      previous,
      difference: current !== null && previous !== null ? current - previous : null,
      growthPercent: growthPercent(current, previous),
      currentYearValue: aggregate(
        finished.map((entry) => entry.current ?? 0),
        aggregation,
      ),
      currentYearMonths: finished.length,
      previousYearValue: aggregate(
        previousYear.map((entry) => entry.previous ?? 0),
        aggregation,
      ),
      previousYearMonths: previousYear.length,
    },
  };
}

/**
 * Monthly values (`YYYY-MM` → value) of one KPI and currency: one store, or with
 * `storeNr` null every store added together. Adding stores is exact for sales, receipts and
 * new customers; a customer who shopped in two stores counts twice in the other counts.
 */
export function monthlyValues(
  rows: readonly StoreMonthValue[],
  kpiCode: string,
  currency: string | null,
  storeNr: number | null,
): Map<string, number> {
  const values = new Map<string, number>();

  for (const row of rows) {
    if (
      row.kpiCode !== kpiCode ||
      row.currency !== currency ||
      (storeNr !== null && row.storeNr !== storeNr)
    ) {
      continue;
    }

    const key = row.monthStart.slice(0, 7);

    values.set(key, (values.get(key) ?? 0) + row.value);
  }

  return values;
}

function rowKey(row: StoreMonthValue): string {
  return [row.monthStart, String(row.storeNr), row.kpiCode, row.currency ?? ''].join('|');
}

/** decimal(19, 4): values closer than this are the same stored value. */
const VALUE_TOLERANCE = 0.00005;

export interface RefreshPlan {
  inserts: StoreMonthValue[];
  updates: { id: string; value: number }[];
  deleteIds: string[];
}

/**
 * What a refresh writes: new values are inserted, changed ones updated, and values Tiger no
 * longer has (a store without documents that month) deleted. Unchanged rows are not touched.
 */
export function planRefresh(
  stored: readonly StoredStoreMonthValue[],
  fresh: readonly StoreMonthValue[],
): RefreshPlan {
  const byKey = new Map(stored.map((row) => [rowKey(row), row]));
  const plan: RefreshPlan = { inserts: [], updates: [], deleteIds: [] };

  for (const row of fresh) {
    const key = rowKey(row);
    const existing = byKey.get(key);

    if (!existing) {
      plan.inserts.push(row);
      continue;
    }

    byKey.delete(key);

    if (Math.abs(existing.value - row.value) >= VALUE_TOLERANCE) {
      plan.updates.push({ id: existing.id, value: row.value });
    }
  }

  plan.deleteIds = [...byKey.values()].map((row) => row.id);

  return plan;
}
