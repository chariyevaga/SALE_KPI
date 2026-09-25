import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  daysBetween,
  parseImportCount,
  parseImportDate,
  parseImportSheet,
  previousDay,
} from './visitor-count-import-rules.js';

const NOW = new Date('2026-09-25T08:00:00Z');
const HEADER = ['Tarih', 'İş yeri no', 'İş yeri', 'Ziyaretçi sayısı'];

void test('reads Excel dates, serial numbers and typed dates', () => {
  assert.equal(parseImportDate(new Date(Date.UTC(2026, 8, 21))), '2026-09-21');
  // 46286 is 2026-09-21 in Excel's day count; a time of day is ignored.
  assert.equal(parseImportDate(46286), '2026-09-21');
  assert.equal(parseImportDate(46286.75), '2026-09-21');
  assert.equal(parseImportDate('2026-09-21'), '2026-09-21');
  assert.equal(parseImportDate(' 21.09.2026 '), '2026-09-21');
  assert.equal(parseImportDate('1/9/2026'), '2026-09-01');
});

void test('rejects dates that do not exist or are not dates', () => {
  assert.equal(parseImportDate('31.02.2026'), null);
  assert.equal(parseImportDate('2026-13-01'), null);
  assert.equal(parseImportDate('dün'), null);
  assert.equal(parseImportDate(true), null);
  assert.equal(parseImportDate(null), null);
});

void test('a count is a whole number from 0 up, typed or as text', () => {
  assert.equal(parseImportCount(0), 0);
  assert.equal(parseImportCount(184), 184);
  assert.equal(parseImportCount('1 234'), 1234);
  assert.equal(parseImportCount(12.5), null);
  assert.equal(parseImportCount(-3), null);
  assert.equal(parseImportCount('12a'), null);
  assert.equal(parseImportCount(2_000_000), null);
});

void test('skips the header, empty rows and rows left without a count', () => {
  const parsed = parseImportSheet(
    [
      HEADER,
      ['2026-09-21', 2, 'Merkez', 184],
      [null, null, null, null],
      ['2026-09-21', 3, 'Şube', null],
      ['2026-09-22', 2, 'Merkez', 0],
    ],
    NOW,
  );

  assert.deepEqual(parsed.rows, [
    { row: 2, date: '2026-09-21', storeNr: 2, visitorCount: 184 },
    // A day entered as 0 is a real count (ADR-052).
    { row: 5, date: '2026-09-22', storeNr: 2, visitorCount: 0 },
  ]);
  assert.equal(parsed.skipped, 1);
  assert.deepEqual(parsed.errors, []);
});

void test('reports every wrong row with its Excel row number', () => {
  const parsed = parseImportSheet(
    [
      HEADER,
      ['yesterday', 2, '', 10],
      ['2026-09-28', 2, '', 10],
      ['2026-09-21', 'Merkez', '', 10],
      ['2026-09-21', 2, '', 'ten'],
      ['2026-09-21', 2, '', 10],
      ['2026-09-21', '2', '', 12],
    ],
    NOW,
  );

  assert.deepEqual(parsed.errors, [
    { row: 2, code: 'INVALID_DATE' },
    { row: 3, code: 'FUTURE_DATE' },
    { row: 4, code: 'INVALID_STORE' },
    { row: 5, code: 'INVALID_COUNT' },
    // The same store and day twice: which number is right is the user's call.
    { row: 7, code: 'DUPLICATE' },
  ]);
  assert.equal(parsed.rows.length, 1);
});

void test('lists the days of a range and the day before', () => {
  assert.deepEqual(daysBetween('2026-09-29', '2026-10-02'), [
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
  ]);
  assert.deepEqual(daysBetween('2026-09-02', '2026-09-01'), []);
  assert.equal(previousDay('2026-10-01'), '2026-09-30');
});
