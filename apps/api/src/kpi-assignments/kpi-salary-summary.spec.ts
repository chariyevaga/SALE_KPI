import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import { toSalaryPayout } from '../employee-salaries/salary-payout.js';
import { toKpiSalarySummary } from './kpi-assignment-response.js';

const salary = {
  effectiveMonth: '2026-07-01',
  amount: 10_000,
  currency: 'TMT',
  fixedPercent: 30,
  kpiPercent: 70,
} as EmployeeSalaryEntity;

void test('the plan list summary counts plans without a salary and plans not calculated', () => {
  const summary = toKpiSalarySummary([
    toSalaryPayout(salary, 50),
    toSalaryPayout(salary, null),
    null,
  ]);

  assert.equal(summary.planCount, 3);
  assert.equal(summary.withoutSalaryCount, 1);
  assert.equal(summary.notCalculatedCount, 1);
  assert.deepEqual(
    summary.totals.map((total) => [total.currency, total.planCount, total.totalEarned]),
    [['TMT', 2, 3_000 + 3_500 + 3_000]],
  );
});

void test('a period without plans has an empty summary', () => {
  assert.deepEqual(toKpiSalarySummary([]), {
    planCount: 0,
    withoutSalaryCount: 0,
    notCalculatedCount: 0,
    totals: [],
  });
});
