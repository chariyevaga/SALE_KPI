import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isPeriodOpen, periodLabel, periodOrder, previousMonth } from './kpi-period-rules.js';

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
