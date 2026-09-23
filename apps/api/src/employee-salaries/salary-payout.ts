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
