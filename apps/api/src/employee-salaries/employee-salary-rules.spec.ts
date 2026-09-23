import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  monthOf,
  percentsAddUp,
  salaryInForce,
  salaryMonthLabel,
  salaryMonthStart,
  splitSalary,
} from './employee-salary-rules.js';

const salaries = [
  { id: 'jun', effectiveMonth: '2026-06-01' },
  { id: 'sep', effectiveMonth: '2026-09-01' },
  { id: 'jan', effectiveMonth: '2027-01-01' },
];

void test('the latest salary not after the month is in force', () => {
  assert.equal(salaryInForce(salaries, '2026-09')?.id, 'sep');
  // Nothing entered for October and November: September's salary still applies.
  assert.equal(salaryInForce(salaries, '2026-10')?.id, 'sep');
  assert.equal(salaryInForce(salaries, '2026-12')?.id, 'sep');
  assert.equal(salaryInForce(salaries, '2027-03')?.id, 'jan');
  assert.equal(salaryInForce(salaries, '2026-07')?.id, 'jun');
});

void test('no salary before the first one; order of the list does not matter', () => {
  assert.equal(salaryInForce(salaries, '2026-05'), null);
  assert.equal(salaryInForce([...salaries].reverse(), '2026-10')?.id, 'sep');
  assert.equal(salaryInForce([], '2026-10'), null);
});

void test('fixed and KPI percentages must add up to exactly 100', () => {
  assert.equal(percentsAddUp(30, 70), true);
  assert.equal(percentsAddUp(33.33, 66.67), true);
  assert.equal(percentsAddUp(0, 100), true);
  assert.equal(percentsAddUp(30, 60), false);
  assert.equal(percentsAddUp(50.01, 50), false);
});

void test('a salary splits into parts that always add up to the whole', () => {
  assert.deepEqual(splitSalary(12_000, 30), { fixedAmount: 3_600, kpiAmount: 8_400 });

  const odd = splitSalary(1_000.01, 33.33);

  assert.equal(Math.round((odd.fixedAmount + odd.kpiAmount) * 100) / 100, 1_000.01);
});

void test('months convert between the API label and the stored first day', () => {
  assert.equal(salaryMonthStart('2026-09'), '2026-09-01');
  assert.equal(salaryMonthLabel('2026-09-01'), '2026-09');
  assert.equal(monthOf(new Date(Date.UTC(2026, 8, 30, 23, 0))), '2026-09');
});
