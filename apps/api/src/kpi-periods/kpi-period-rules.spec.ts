import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  canReopenPeriod,
  isPeriodOpen,
  periodLabel,
  periodOrder,
  previousMonth,
  reopenableUntil,
} from './kpi-period-rules.js';

void test('names a period after its month', () => {
  assert.equal(periodLabel({ year: 2026, month: 9 }), '2026-09');
  assert.equal(periodLabel({ year: 2026, month: 12 }), '2026-12');
});

void test('orders periods by month across year boundaries', () => {
  assert.ok(periodOrder({ year: 2027, month: 1 }) > periodOrder({ year: 2026, month: 12 }));
  assert.equal(periodOrder({ year: 2026, month: 12 }) - periodOrder({ year: 2026, month: 11 }), 1);
});

void test('the month before January is December of the year before', () => {
  assert.deepEqual(previousMonth({ year: 2026, month: 1 }), { year: 2025, month: 12 });
  assert.deepEqual(previousMonth({ year: 2026, month: 9 }), { year: 2026, month: 8 });
});

void test('only an open period accepts plans and targets', () => {
  assert.equal(isPeriodOpen({ status: 'open' }), true);
  assert.equal(isPeriodOpen({ status: 'closed' }), false);
});

void test('a closed period can be reopened through the 10th day after its month ends', () => {
  const october = { year: 2026, month: 10, status: 'closed' as const };

  assert.equal(reopenableUntil(october), '2026-11-10');
  assert.equal(canReopenPeriod(october, new Date('2026-09-21T12:00:00Z')), true);
  assert.equal(canReopenPeriod(october, new Date('2026-11-10T23:59:59Z')), true);
  assert.equal(canReopenPeriod(october, new Date('2026-11-11T00:00:00Z')), false);
});

void test('the reopen window of December runs into January', () => {
  assert.equal(reopenableUntil({ year: 2026, month: 12 }), '2027-01-10');
});

void test('an open period has nothing to reopen', () => {
  assert.equal(
    canReopenPeriod({ year: 2026, month: 10, status: 'open' }, new Date('2026-10-01T00:00:00Z')),
    false,
  );
});
