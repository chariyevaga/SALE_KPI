/** Which part of a salary the person knows the amount of. */
export type SalaryPart = 'fixed' | 'kpi';

export interface SalaryFromPart {
  /** The whole salary, in cents precision. */
  amount: number;
  fixedAmount: number;
  kpiAmount: number;
  /** False when no salary in whole cents splits to exactly the asked part. */
  exact: boolean;
}

const cents = (value: number) => Math.round(value * 100);

/**
 * The fixed and KPI parts of `amount`, rounded the way the API stores them
 * (`splitSalary`, apps/api/src/employee-salaries/employee-salary-rules.ts): the fixed part
 * to cents, the KPI part is the remainder.
 */
export function splitSalaryAmount(
  amount: number,
  fixedPercent: number,
): { fixedAmount: number; kpiAmount: number } {
  const fixedAmount = Math.round(amount * fixedPercent) / 100;

  return { fixedAmount, kpiAmount: Math.round((amount - fixedAmount) * 100) / 100 };
}

/**
 * The salary whose `part` comes to `partAmount` at the given split: "the fixed part should
 * be 1.000 at 30 %" → 3.333,33 (1.000 + 2.333,33). The direct division is rarely a whole
 * number of cents, so the cents around it are tried and the one closest to it that splits
 * to exactly `partAmount` wins. `null` when that part's percentage is 0 or the input is
 * not a positive amount.
 */
export function salaryFromPart(
  part: SalaryPart,
  partAmount: number,
  fixedPercent: number,
): SalaryFromPart | null {
  const percent = part === 'fixed' ? fixedPercent : 100 - fixedPercent;

  if (!Number.isFinite(partAmount) || partAmount <= 0 || !(percent > 0) || percent > 100) {
    return null;
  }

  const target = cents(partAmount);
  const estimate = (partAmount * 100) / percent;
  const base = cents(estimate);
  let best: SalaryFromPart | null = null;

  for (const offset of [0, -1, 1, -2, 2, -3, 3]) {
    const amount = (base + offset) / 100;
    const split = splitSalaryAmount(amount, fixedPercent);
    const value = part === 'fixed' ? split.fixedAmount : split.kpiAmount;

    if (amount > 0 && cents(value) === target) {
      best = { amount, ...split, exact: true };
      break;
    }
  }

  return (
    best ?? { amount: base / 100, ...splitSalaryAmount(base / 100, fixedPercent), exact: false }
  );
}
