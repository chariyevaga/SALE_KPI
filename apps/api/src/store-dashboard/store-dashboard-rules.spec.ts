import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  compareYears,
  growthPercent,
  monthStatus,
  monthlyValues,
  planRefresh,
  refreshWindow,
  type StoreMonthValue,
} from './store-dashboard-rules.js';

void test('refreshes January of last year through the current month', () => {
  assert.deepEqual(refreshWindow('2026-09-29'), { from: '2025-01-01', to: '2026-09-01' });
  assert.deepEqual(refreshWindow('2027-01-01'), { from: '2026-01-01', to: '2027-01-01' });
});

void test('a month is complete, in progress or upcoming against the current month', () => {
  assert.equal(monthStatus(2026, 8, '2026-09'), 'complete');
  assert.equal(monthStatus(2026, 9, '2026-09'), 'inProgress');
  assert.equal(monthStatus(2026, 10, '2026-09'), 'upcoming');
  assert.equal(monthStatus(2025, 12, '2026-09'), 'complete');
});

void test('growth needs a positive base and keeps one decimal', () => {
  assert.equal(growthPercent(112, 100), 12);
  assert.equal(growthPercent(90, 120), -25);
  assert.equal(growthPercent(1, 3), -66.7);
  assert.equal(growthPercent(5, 0), null);
  assert.equal(growthPercent(5, -10), null);
  assert.equal(growthPercent(null, 10), null);
  assert.equal(growthPercent(10, null), null);
});

void test('compares only finished months that have values in both years', () => {
  const values = new Map([
    ['2025-03', 100],
    ['2025-04', 200],
    ['2025-05', 50],
    ['2025-09', 400],
    ['2026-03', 150],
    ['2026-04', 180],
    ['2026-08', 70],
    ['2026-09', 20],
  ]);
  const { months, summary } = compareYears(values, 2026, '2026-09', 'sum');

  assert.equal(months.length, 12);
  assert.deepEqual(months[2], {
    month: 3,
    status: 'complete',
    current: 150,
    previous: 100,
    growthPercent: 50,
  });
  // May had sales last year only; August this year only; September is still running.
  assert.equal(months[4]?.growthPercent, null);
  assert.equal(months[7]?.growthPercent, null);
  assert.deepEqual(months[8], {
    month: 9,
    status: 'inProgress',
    current: 20,
    previous: 400,
    growthPercent: null,
  });
  assert.equal(months[9]?.status, 'upcoming');

  assert.deepEqual(summary, {
    comparableMonths: [3, 4],
    current: 330,
    previous: 300,
    difference: 30,
    growthPercent: 10,
    currentYearValue: 400,
    currentYearMonths: 3,
    previousYearValue: 750,
    previousYearMonths: 4,
  });
});

void test('distinct counts compare monthly averages; growth equals the sum comparison', () => {
  const values = new Map([
    ['2025-01', 100],
    ['2025-02', 300],
    ['2026-01', 150],
    ['2026-02', 330],
  ]);
  const average = compareYears(values, 2026, '2026-09', 'average').summary;
  const sum = compareYears(values, 2026, '2026-09', 'sum').summary;

  assert.equal(average.current, 240);
  assert.equal(average.previous, 200);
  assert.equal(average.growthPercent, 20);
  assert.equal(sum.growthPercent, average.growthPercent);
});

void test('without last year the comparison is empty but this year still adds up', () => {
  const values = new Map([
    ['2026-03', 10],
    ['2026-04', 20],
  ]);
  const { summary } = compareYears(values, 2026, '2026-09', 'sum');

  assert.deepEqual(summary.comparableMonths, []);
  assert.equal(summary.current, null);
  assert.equal(summary.growthPercent, null);
  assert.equal(summary.currentYearValue, 30);
  assert.equal(summary.previousYearValue, null);
  assert.equal(summary.previousYearMonths, 0);
});

void test('a past year is compared in full', () => {
  const values = new Map([
    ['2025-12', 200],
    ['2024-12', 100],
  ]);
  const { months, summary } = compareYears(values, 2025, '2026-09', 'sum');

  assert.equal(months[11]?.status, 'complete');
  assert.equal(summary.growthPercent, 100);
});

const ROWS: StoreMonthValue[] = [
  { storeNr: 0, monthStart: '2026-03-01', kpiCode: 'STORE_SALES', currency: 'TMT', value: 100 },
  { storeNr: 0, monthStart: '2026-03-01', kpiCode: 'STORE_SALES', currency: 'USD', value: 5 },
  { storeNr: 1, monthStart: '2026-03-01', kpiCode: 'STORE_SALES', currency: 'TMT', value: 40 },
  { storeNr: 1, monthStart: '2026-04-01', kpiCode: 'STORE_SALES', currency: 'TMT', value: 60 },
  { storeNr: 0, monthStart: '2026-03-01', kpiCode: 'STORE_RECEIPTS', currency: null, value: 9 },
];

void test('monthly values of one store, or of every store added together', () => {
  assert.deepEqual(
    [...monthlyValues(ROWS, 'STORE_SALES', 'TMT', null)],
    [
      ['2026-03', 140],
      ['2026-04', 60],
    ],
  );
  assert.deepEqual([...monthlyValues(ROWS, 'STORE_SALES', 'TMT', 0)], [['2026-03', 100]]);
  assert.deepEqual([...monthlyValues(ROWS, 'STORE_SALES', 'USD', null)], [['2026-03', 5]]);
  assert.deepEqual([...monthlyValues(ROWS, 'STORE_RECEIPTS', null, null)], [['2026-03', 9]]);
});

void test('a refresh inserts new values, updates changed ones and deletes the missing', () => {
  const stored = [
    { ...ROWS[0]!, id: 'a' },
    { ...ROWS[1]!, id: 'b', value: 4.5 },
    { ...ROWS[2]!, id: 'c' },
    { ...ROWS[4]!, id: 'd', value: 9.00001 },
  ];
  const fresh = [ROWS[0]!, ROWS[1]!, ROWS[3]!, ROWS[4]!];

  assert.deepEqual(planRefresh(stored, fresh), {
    inserts: [ROWS[3]],
    updates: [{ id: 'b', value: 5 }],
    deleteIds: ['c'],
  });
  assert.deepEqual(planRefresh([], []), { inserts: [], updates: [], deleteIds: [] });
});
