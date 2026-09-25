import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildVisitorCountReport, previousRange } from './visitor-count-report-rules.js';

const STORES = [
  { id: 6, nr: 0, name: 'Merkez' },
  { id: 11, nr: 2, name: 'Şube' },
];

void test('the previous period is the same number of days just before', () => {
  assert.deepEqual(previousRange('2026-09-01', '2026-09-30'), {
    from: '2026-08-02',
    to: '2026-08-31',
  });
  assert.deepEqual(previousRange('2026-09-21', '2026-09-21'), {
    from: '2026-09-20',
    to: '2026-09-20',
  });
});

void test('totals, averages per entered store-day and the change against before', () => {
  const report = buildVisitorCountReport({
    from: '2026-09-21',
    to: '2026-09-23',
    today: '2026-09-23',
    stores: STORES,
    counts: [
      { storeId: 6, date: '2026-09-21', visitorCount: 100 },
      { storeId: 11, date: '2026-09-21', visitorCount: 50 },
      { storeId: 6, date: '2026-09-22', visitorCount: 120 },
      // 11 on the 22nd was not entered; today (23rd) nothing yet.
    ],
    previousCounts: [
      { storeId: 6, date: '2026-09-18', visitorCount: 80 },
      { storeId: 11, date: '2026-09-18', visitorCount: 40 },
    ],
  });

  assert.equal(report.current.visitors, 270);
  assert.equal(report.current.countedStoreDays, 3);
  // Two past days × two stores; today is left out until someone enters it.
  assert.equal(report.current.possibleStoreDays, 4);
  assert.equal(report.current.average, 90);
  assert.equal(report.previous.average, 60);
  assert.equal(report.averageChange, 50);
  assert.deepEqual(report.busiestDay, { date: '2026-09-21', visitors: 150 });
  assert.deepEqual(
    report.days.map((day) => day.visitors),
    [150, 120, null],
  );
  assert.deepEqual(
    report.stores.map((store) => [store.storeNr, store.visitors, store.days, store.average]),
    [
      [0, 220, 2, 110],
      [2, 50, 1, 50],
    ],
  );
  // 2026-09-21 is a Monday, the 22nd a Tuesday.
  assert.deepEqual(report.weekdays.slice(0, 3), [
    { weekday: 1, average: 75, storeDays: 2 },
    { weekday: 2, average: 120, storeDays: 1 },
    { weekday: 3, average: null, storeDays: 0 },
  ]);
});

void test('an empty range has no averages, no change and no busiest day', () => {
  const report = buildVisitorCountReport({
    from: '2026-09-01',
    to: '2026-09-02',
    today: '2026-09-25',
    stores: STORES,
    counts: [],
    previousCounts: [],
  });

  assert.equal(report.current.average, null);
  assert.equal(report.averageChange, null);
  assert.equal(report.busiestDay, null);
  assert.equal(report.current.possibleStoreDays, 4);
  assert.deepEqual(
    report.stores.map((store) => store.days),
    [0, 0],
  );
});
