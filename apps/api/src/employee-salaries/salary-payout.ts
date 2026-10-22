import { ApiProperty } from '@nestjs/swagger';

import type { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import {
  SALARY_CURRENCIES,
  type SalaryCurrency,
  salaryMonthLabel,
  salaryShare,
  splitSalary,
} from './employee-salary-rules.js';

/** The salary in force in a plan's month and what the plan's score earns of it (ADR-049). */
export class SalaryPayoutResponse {
  @ApiProperty({ type: String, example: '2026-09', description: 'Maaşın geçerli olduğu ilk ay.' })
  effectiveMonth: string;

  @ApiProperty({ type: Number, example: 12000 })
  amount: number;

  @ApiProperty({ type: String, enum: SALARY_CURRENCIES })
  currency: SalaryCurrency;

  @ApiProperty({ type: Number, example: 30 })
  fixedPercent: number;

  @ApiProperty({ type: Number, example: 70 })
  kpiPercent: number;

  @ApiProperty({ type: Number, example: 3600 })
  fixedAmount: number;

  @ApiProperty({ type: Number, example: 8400, description: 'KPI kısmının tamamı (puan 100 iken).' })
  kpiAmount: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1438.08,
    description:
      'KPI kısmından kazanılan: KPI kısmı × toplam puan / 100. Hiç hesaplanmadıysa `null`.',
  })
  kpiEarned: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 5038.08,
    description: 'Sabit kısım + kazanılan KPI kısmı. Açık dönemde ara sonuçtur.',
  })
  totalEarned: number | null;
}

/** What a set of plans pays in one currency: the sums of their payouts (ADR-067). */
export class SalaryPayoutTotalResponse {
  @ApiProperty({ type: String, enum: SALARY_CURRENCIES })
  currency: SalaryCurrency;

  @ApiProperty({
    type: Number,
    example: 6,
    description: 'Maaşı bu para biriminde olan plan sayısı.',
  })
  planCount: number;

  @ApiProperty({ type: Number, example: 72000, description: 'Maaşların toplamı.' })
  amount: number;

  @ApiProperty({ type: Number, example: 21600 })
  fixedAmount: number;

  @ApiProperty({ type: Number, example: 50400, description: 'KPI kısımlarının tamamı.' })
  kpiAmount: number;

  @ApiProperty({
    type: Number,
    example: 40875.12,
    description: 'KPI kısımlarından kazanılan; hesaplanmamış plan 0 sayılır.',
  })
  kpiEarned: number;

  @ApiProperty({
    type: Number,
    example: 62475.12,
    description: 'Sabit kısımlar + kazanılan KPI kısımları. Açık dönemde ara sonuçtur.',
  })
  totalEarned: number;
}

/**
 * The payouts summed per currency, in the order of `SALARY_CURRENCIES` (ADR-067). TMT and
 * USD are never added together. A plan not calculated yet adds its fixed part and nothing
 * of its KPI part, like the plan's own card shows it. Sums are kept in cents.
 */
export function sumSalaryPayouts(
  payouts: readonly (SalaryPayoutResponse | null)[],
): SalaryPayoutTotalResponse[] {
  const cents = (value: number) => Math.round(value * 100);
  const sums = new Map<
    SalaryCurrency,
    { planCount: number; amount: number; fixedAmount: number; kpiAmount: number; kpiEarned: number }
  >();

  for (const payout of payouts) {
    if (!payout) continue;

    const sum = sums.get(payout.currency) ?? {
      planCount: 0,
      amount: 0,
      fixedAmount: 0,
      kpiAmount: 0,
      kpiEarned: 0,
    };

    sum.planCount += 1;
    sum.amount += cents(payout.amount);
    sum.fixedAmount += cents(payout.fixedAmount);
    sum.kpiAmount += cents(payout.kpiAmount);
    sum.kpiEarned += cents(payout.kpiEarned ?? 0);
    sums.set(payout.currency, sum);
  }

  return SALARY_CURRENCIES.flatMap((currency) => {
    const sum = sums.get(currency);

    return sum
      ? [
          {
            currency,
            planCount: sum.planCount,
            amount: sum.amount / 100,
            fixedAmount: sum.fixedAmount / 100,
            kpiAmount: sum.kpiAmount / 100,
            kpiEarned: sum.kpiEarned / 100,
            totalEarned: (sum.fixedAmount + sum.kpiEarned) / 100,
          },
        ]
      : [];
  });
}

/**
 * What a plan pays: the salary in force in its month split into the fixed part and what the
 * score earns of the KPI part (ADR-049). One builder for every response that shows it.
 */
export function toSalaryPayout(
  salary: EmployeeSalaryEntity,
  totalScore: number | null,
): SalaryPayoutResponse {
  const { fixedAmount, kpiAmount } = splitSalary(salary.amount, salary.fixedPercent);
  const kpiEarned = totalScore === null ? null : salaryShare(kpiAmount, totalScore);

  return {
    effectiveMonth: salaryMonthLabel(salary.effectiveMonth),
    amount: salary.amount,
    currency: salary.currency,
    fixedPercent: salary.fixedPercent,
    kpiPercent: salary.kpiPercent,
    fixedAmount,
    kpiAmount,
    kpiEarned,
    totalEarned: kpiEarned === null ? null : Math.round((fixedAmount + kpiEarned) * 100) / 100,
  };
}
