import { daysBetween } from './visitor-count-import-rules.js';

/**
 * Visitor count report (ADR-056): totals, the daily series, the weekday pattern and the
 * store ranking of a date range, compared with the same number of days just before it.
 * Only entered store-days count; averages are per entered store-day, so a missing entry
 * never reads as an empty store.
 */
export const MAX_REPORT_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReportCount {
  storeId: number;
  /** `YYYY-MM-DD` */
  date: string;
  visitorCount: number;
}

export interface ReportStore {
  id: number;
  nr: number;
  name: string | null;
}

export interface ReportDay {
  date: string;
  /** Sum of the entered stores; null when no store has a count for the day. */
  visitors: number | null;
  /** Stores with a count that day. */
  stores: number;
}

export interface ReportWeekday {
  /** ISO weekday: 1 Monday … 7 Sunday. */
  weekday: number;
  /** Average visitors per entered store-day; null without any entry. */
  average: number | null;
  storeDays: number;
}

export interface ReportStoreTotal {
  storeId: number;
  storeNr: number;
  storeName: string | null;
  visitors: number;
  /** Days of the range with a count for this store. */
  days: number;
  average: number | null;
}

export interface ReportPeriod {
  from: string;
  to: string;
  visitors: number;
  countedStoreDays: number;
  /** Store-days that could have a count: every past day, today only once entered. */
  possibleStoreDays: number;
  average: number | null;
}

export interface VisitorCountReport {
  current: ReportPeriod;
  previous: ReportPeriod;
  /** Change of the per-store-day average against the previous period, in percent. */
  averageChange: number | null;
  storeCount: number;
  busiestDay: { date: string; visitors: number } | null;
  days: ReportDay[];
  weekdays: ReportWeekday[];
  stores: ReportStoreTotal[];
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

function shiftDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** The range of the same length that ends the day before `from`. */
export function previousRange(from: string, to: string): { from: string; to: string } {
  const length = daysBetween(from, to).length;

  return { from: shiftDays(from, -length), to: shiftDays(from, -1) };
}

function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();

  return day === 0 ? 7 : day;
}

function summarize(
  from: string,
  to: string,
  counts: readonly ReportCount[],
  storeCount: number,
  today: string,
): ReportPeriod {
  const visitors = counts.reduce((sum, count) => sum + count.visitorCount, 0);
  const enteredToday = counts.some((count) => count.date === today);
  const possibleDays = daysBetween(from, to).filter(
    (date) => date < today || (date === today && enteredToday),
  ).length;

  return {
    from,
    to,
    visitors,
    countedStoreDays: counts.length,
    possibleStoreDays: possibleDays * storeCount,
    average: counts.length > 0 ? round(visitors / counts.length) : null,
  };
}

/**
 * Builds the report from the counts of both periods. `counts` and `previousCounts` must
 * already be limited to `stores` and to their own range.
 */
export function buildVisitorCountReport(input: {
  from: string;
  to: string;
  today: string;
  stores: readonly ReportStore[];
  counts: readonly ReportCount[];
  previousCounts: readonly ReportCount[];
}): VisitorCountReport {
  const { from, to, today, stores, counts } = input;
  const previousDates = previousRange(from, to);
  const current = summarize(from, to, counts, stores.length, today);
  const previous = summarize(
    previousDates.from,
    previousDates.to,
    input.previousCounts,
    stores.length,
    today,
  );

  const byDay = new Map<string, { visitors: number; stores: number }>();
  const byWeekday = new Map<number, { visitors: number; storeDays: number }>();
  const byStore = new Map<number, { visitors: number; days: number }>();

  for (const count of counts) {
    const day = byDay.get(count.date) ?? { visitors: 0, stores: 0 };
    const weekday = isoWeekday(count.date);
    const week = byWeekday.get(weekday) ?? { visitors: 0, storeDays: 0 };
    const store = byStore.get(count.storeId) ?? { visitors: 0, days: 0 };

    byDay.set(count.date, { visitors: day.visitors + count.visitorCount, stores: day.stores + 1 });
    byWeekday.set(weekday, {
      visitors: week.visitors + count.visitorCount,
      storeDays: week.storeDays + 1,
    });
    byStore.set(count.storeId, {
      visitors: store.visitors + count.visitorCount,
      days: store.days + 1,
    });
  }

  const days = daysBetween(from, to).map((date): ReportDay => {
    const day = byDay.get(date);

    return { date, visitors: day?.visitors ?? null, stores: day?.stores ?? 0 };
  });
  let busiestDay: VisitorCountReport['busiestDay'] = null;

  for (const day of days) {
    if (day.visitors !== null && (busiestDay === null || day.visitors > busiestDay.visitors)) {
      busiestDay = { date: day.date, visitors: day.visitors };
    }
  }

  return {
    current,
    previous,
    averageChange:
      current.average !== null && previous.average !== null && previous.average > 0
        ? round(((current.average - previous.average) / previous.average) * 100)
        : null,
    storeCount: stores.length,
    busiestDay,
    days,
    weekdays: [1, 2, 3, 4, 5, 6, 7].map((weekday): ReportWeekday => {
      const week = byWeekday.get(weekday);

      return {
        weekday,
        average: week ? round(week.visitors / week.storeDays) : null,
        storeDays: week?.storeDays ?? 0,
      };
    }),
    stores: stores
      .map((store): ReportStoreTotal => {
        const total = byStore.get(store.id);

        return {
          storeId: store.id,
          storeNr: store.nr,
          storeName: store.name,
          visitors: total?.visitors ?? 0,
          days: total?.days ?? 0,
          average: total ? round(total.visitors / total.days) : null,
        };
      })
      .sort((a, b) => b.visitors - a.visitors || a.storeNr - b.storeNr),
  };
}
