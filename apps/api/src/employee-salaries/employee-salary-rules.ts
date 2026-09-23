/**
 * Salary rules (ADR-048). A salary is entered with the month it takes effect from, not per
 * KPI period: the salary of a month is the latest one that took effect on or before it.
 * Each salary splits into a fixed part and a KPI-dependent part whose percentages add up
 * to 100 and differ from person to person.
 */

export const SALARY_CURRENCIES = ['TMT', 'USD'] as const;

export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];

export const MAX_SALARY_AMOUNT = 999_999_999.99;

/** `YYYY-MM`: how the API names the month a salary takes effect from. */
export const SALARY_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** `2026-09` → `2026-09-01`, the value `effective_month` stores. */
export function salaryMonthStart(month: string): string {
  return `${month}-01`;
}

/** `2026-09-01` (or a Date-like string) → `2026-09`. */
export function salaryMonthLabel(monthStart: string): string {
  return monthStart.slice(0, 7);
}

/** The month a date falls in, `YYYY-MM`, in UTC like the rest of the API. */
export function monthOf(date: Date): string {
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * The salary in force in `month` (`YYYY-MM`): the latest one whose month is not after it.
 * September's salary stays in force in October and November until a newer one is entered.
 */
export function salaryInForce<T extends { effectiveMonth: string }>(
  salaries: readonly T[],
  month: string,
): T | null {
  let found: T | null = null;

  for (const salary of salaries) {
    const effective = salaryMonthLabel(salary.effectiveMonth);

    if (effective <= month && (!found || effective > salaryMonthLabel(found.effectiveMonth))) {
      found = salary;
    }
  }

  return found;
}

/** Fixed and KPI percentages must add up to exactly 100 (2 decimals, like the columns). */
export function percentsAddUp(fixedPercent: number, kpiPercent: number): boolean {
  return Math.round((fixedPercent + kpiPercent) * 100) === 10_000;
}

/** The two parts of a salary, in money; the KPI part is the remainder, so they always add up. */
export function splitSalary(
  amount: number,
  fixedPercent: number,
): { fixedAmount: number; kpiAmount: number } {
  const fixedAmount = Math.round(amount * fixedPercent) / 100;

  return { fixedAmount, kpiAmount: Math.round((amount - fixedAmount) * 100) / 100 };
}

/**
 * The part of the KPI money that `points` earn, points being on the 0–100 score scale of
 * docs/BUSINESS_RULES.md "Puan hesabı" (ADR-049). A KPI row with weight 40 is worth
 * `kpiAmount × 40 / 100`; its weighted score (achievement capped at 100 × weight / 100)
 * earns `kpiAmount × weightedScore / 100`; the plan's total score earns
 * `kpiAmount × totalScore / 100`. The score is already capped, so nothing pays above 100%.
 */
export function salaryShare(kpiAmount: number, points: number): number {
  return Math.round(kpiAmount * points) / 100;
}
