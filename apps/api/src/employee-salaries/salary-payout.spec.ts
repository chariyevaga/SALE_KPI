import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import { toSalaryPayout } from './salary-payout.js';

function salary(amount: number, fixedPercent: number): EmployeeSalaryEntity {
  return {
    effectiveMonth: '2026-09-01',
    amount,
    currency: 'TMT',
    fixedPercent,
    kpiPercent: 100 - fixedPercent,
  } as EmployeeSalaryEntity;
}

void test('a plan pays the fixed part plus the KPI part in proportion to its score', () => {
  assert.deepEqual(toSalaryPayout(salary(10_000, 30), 17.12), {
    effectiveMonth: '2026-09',
    amount: 10_000,
    currency: 'TMT',
    fixedPercent: 30,
    kpiPercent: 70,
    fixedAmount: 3_000,
    kpiAmount: 7_000,
    kpiEarned: 1_198.4,
    totalEarned: 4_198.4,
  });
});

void test('before the first calculation only the fixed part is known', () => {
  const payout = toSalaryPayout(salary(12_000, 30), null);

  assert.equal(payout.kpiEarned, null);
  assert.equal(payout.totalEarned, null);
  assert.equal(payout.fixedAmount, 3_600);
});
