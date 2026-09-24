import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateConversion, consideredDays, dateInZone } from './conversion-rules.js';

const store = { storeId: 6, storeNr: 1 };

function september(dayCount: number): string[] {
  return consideredDays(2026, 9, `2026-09-${String(dayCount + 1).padStart(2, '0')}`);
}

void test('only the days before today count; a finished month counts all of them', () => {
  assert.equal(consideredDays(2026, 9, '2026-09-24').length, 23);
  assert.equal(consideredDays(2026, 9, '2026-09-01').length, 0);
  assert.equal(consideredDays(2026, 9, '2026-10-05').length, 30);
  assert.equal(consideredDays(2026, 2, '2026-03-01').length, 28);
  // Ashgabat is UTC+5: at 20:00 UTC on 23 September it is already the 24th there.
  assert.equal(dateInZone(new Date(Date.UTC(2026, 8, 23, 20)), 'Asia/Ashgabat'), '2026-09-24');
});

void test('receipts and visitors of the counted days only, divided (ADR-052)', () => {
  const days = september(10);
  const visitors = new Map<string, number>();
  const receipts = new Map<string, number>();

  // Counts for 8 of 10 days (80%): 100 visitors and 23 receipts a day.
  for (const day of days.slice(0, 8)) {
    visitors.set(`6|${day}`, 100);
    receipts.set(`1|${day}`, 23);
  }
  // The two uncounted days sold too; their receipts must not count.
  for (const day of days.slice(8)) receipts.set(`1|${day}`, 50);

  const result = calculateConversion([store], days, receipts, visitors);

  assert.equal(result.value, 23);
  assert.deepEqual(result.detail, {
    storeCount: 1,
    countedDays: 8,
    possibleDays: 10,
    coverage: 80,
    requiredCoverage: 80,
    receipts: 184,
    visitors: 800,
    lastDay: '2026-09-10',
  });
});

void test('below 80% coverage the row is not measured', () => {
  const days = september(10);
  const visitors = new Map(days.slice(0, 7).map((day) => [`6|${day}`, 100] as const));
  const result = calculateConversion([store], days, new Map(), visitors);

  assert.equal(result.value, null);
  assert.equal(result.detail.gap, 'low-coverage');
  assert.equal(result.detail.coverage, 70);
});

void test('a 0 count is a counted day (closed store); no day or no visitor gives no value', () => {
  const days = september(5);
  const visitors = new Map(days.map((day) => [`6|${day}`, 0] as const));

  const closed = calculateConversion([store], days, new Map(), visitors);
  assert.equal(closed.detail.coverage, 100);
  assert.equal(closed.detail.gap, 'no-visitors');

  assert.equal(calculateConversion([store], [], new Map(), new Map()).detail.gap, 'no-days');
});

void test('several stores add receipts and visitors before dividing', () => {
  const days = september(1);
  const day = days[0] ?? '';
  const result = calculateConversion(
    [store, { storeId: 7, storeNr: 2 }],
    days,
    new Map([
      [`1|${day}`, 10],
      [`2|${day}`, 90],
    ]),
    new Map([
      [`6|${day}`, 100],
      [`7|${day}`, 300],
    ]),
  );

  // (10 + 90) / (100 + 300), not the average of 10% and 30%.
  assert.equal(result.value, 25);
});
