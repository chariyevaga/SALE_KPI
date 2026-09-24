/**
 * Store conversion (`STORE_CONVERSION`, ADR-052): sales receipts per visitor, from Tiger's
 * receipts and the daily visitor counts stores enter (ADR-043).
 *
 *   conversion = receipts on counted days / visitors on those days × 100
 *
 * - Days considered: the period's days before today (in the business time zone); today is
 *   still running, so its count is not final. A finished month counts every day.
 * - A store-day is counted when a visitor count was entered for it, 0 included (a closed
 *   store). Only counted store-days add receipts and visitors, so both sides cover the same
 *   days; missing days are not guessed.
 * - Coverage = counted store-days / possible store-days. Below MIN_CONVERSION_COVERAGE the
 *   row is not measured at all, so entering only good days cannot lift the score.
 * - Several stores: receipts and visitors are added up first, then divided
 *   (docs/BUSINESS_RULES.md "Dönüşüm").
 */

export const CONVERSION_KPI_CODE = 'STORE_CONVERSION';

/** Percent of the possible store-days that must have a visitor count. */
export const MIN_CONVERSION_COVERAGE = 80;

export type ConversionGap = 'no-days' | 'low-coverage' | 'no-visitors';

export interface ConversionDetail {
  /** Stores the row covers; days below are store-days when there are several. */
  storeCount: number;
  /** Store-days with an entered visitor count. */
  countedDays: number;
  /** Stores × days considered. */
  possibleDays: number;
  /** countedDays / possibleDays × 100, two decimals. */
  coverage: number;
  requiredCoverage: number;
  /** Sales receipts on the counted store-days. */
  receipts: number;
  visitors: number;
  /** The last day considered, `YYYY-MM-DD`; null when none was. */
  lastDay: string | null;
  /** Why no value was produced; absent when there is one. */
  gap?: ConversionGap;
}

export interface ConversionResult {
  value: number | null;
  detail: ConversionDetail;
}

/** `YYYY-MM-DD` of `now` in `timeZone`. */
export function dateInZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The days of the month considered on `today` (`YYYY-MM-DD`): all before today. */
export function consideredDays(year: number, month: number, today: string): string[] {
  const days: string[] = [];
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();

  for (let day = 1; day <= count; day += 1) {
    const date = `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (date < today) {
      days.push(date);
    }
  }

  return days;
}

export interface ConversionStore {
  /** `dbo.stores.id` (Tiger L_CAPIDIV LOGICALREF): the key of visitor counts. */
  storeId: number;
  /** Tiger branch number: the key of receipts. */
  storeNr: number;
}

/**
 * The conversion of the stores of one plan row. `receipts` is keyed `${storeNr}|${date}`,
 * `visitors` `${storeId}|${date}`.
 */
export function calculateConversion(
  stores: readonly ConversionStore[],
  days: readonly string[],
  receipts: ReadonlyMap<string, number>,
  visitors: ReadonlyMap<string, number>,
): ConversionResult {
  let countedDays = 0;
  let receiptTotal = 0;
  let visitorTotal = 0;

  for (const store of stores) {
    for (const day of days) {
      const count = visitors.get(`${String(store.storeId)}|${day}`);

      if (count === undefined) {
        continue;
      }

      countedDays += 1;
      visitorTotal += count;
      receiptTotal += receipts.get(`${String(store.storeNr)}|${day}`) ?? 0;
    }
  }

  const possibleDays = stores.length * days.length;
  const coverage = possibleDays === 0 ? 0 : Math.round((countedDays / possibleDays) * 10_000) / 100;
  const detail: ConversionDetail = {
    storeCount: stores.length,
    countedDays,
    possibleDays,
    coverage,
    requiredCoverage: MIN_CONVERSION_COVERAGE,
    receipts: receiptTotal,
    visitors: visitorTotal,
    lastDay: days.at(-1) ?? null,
  };

  if (possibleDays === 0) {
    return { value: null, detail: { ...detail, gap: 'no-days' } };
  }

  if (coverage < MIN_CONVERSION_COVERAGE) {
    return { value: null, detail: { ...detail, gap: 'low-coverage' } };
  }

  if (visitorTotal === 0) {
    return { value: null, detail: { ...detail, gap: 'no-visitors' } };
  }

  return { value: Math.round((receiptTotal / visitorTotal) * 10_000) / 100, detail };
}
