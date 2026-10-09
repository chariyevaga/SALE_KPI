import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import { sumSalaryPayouts, toSalaryPayout } from './salary-payout.js';

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

void test('totals add each currency on its own, TMT first, and never mix TMT with USD', () => {
  const usd = { ...salary(1_000, 50), currency: 'USD' } as EmployeeSalaryEntity;
  const totals = sumSalaryPayouts([
    toSalaryPayout(usd, 50),
    toSalaryPayout(salary(10_000, 30), 17.12),
    null,
    toSalaryPayout(salary(12_000, 30), 100),
  ]);

  assert.deepEqual(totals, [
    {
      currency: 'TMT',
      planCount: 2,
      amount: 22_000,
      fixedAmount: 6_600,
      kpiAmount: 15_400,
      kpiEarned: 9_598.4,
      totalEarned: 16_198.4,
    },
    {
      currency: 'USD',
      planCount: 1,
      amount: 1_000,
      fixedAmount: 500,
      kpiAmount: 500,
      kpiEarned: 250,
      totalEarned: 750,
    },
  ]);
});

void test('a plan not calculated yet adds its fixed part and none of its KPI part', () => {
  const [total] = sumSalaryPayouts([toSalaryPayout(salary(12_000, 30), null)]);

  assert.equal(total?.kpiEarned, 0);
  assert.equal(total?.totalEarned, 3_600);
  assert.equal(total?.kpiAmount, 8_400);
});

void test('totals are summed in cents, so many small amounts stay exact', () => {
  const payouts = Array.from({ length: 10 }, () => toSalaryPayout(salary(1_000.1, 30), 10));
  const [total] = sumSalaryPayouts(payouts);

  // Each plan: 300.03 fixed + 70.01 earned (700.07 KPI part × 10 / 100).
  assert.equal(total?.fixedAmount, 3_000.3);
  assert.equal(total?.kpiEarned, 700.1);
  assert.equal(total?.totalEarned, 3_700.4);
});

void test('no salary at all gives no totals', () => {
  assert.deepEqual(sumSalaryPayouts([null, null]), []);
});
