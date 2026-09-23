import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DateUtils } from 'typeorm/util/DateUtils.js';

import './load-environment.js';

void test('the API process runs in UTC whatever the machine zone', () => {
  assert.equal(process.env.TZ, 'UTC');
  assert.equal(new Date(2026, 8, 1).toISOString(), '2026-09-01T00:00:00.000Z');
});

void test('a date column keeps its day: TypeORM does not shift 2026-09-01 to August 31', () => {
  // What TypeORM does before sending a `date` column with `utc: true` to SQL Server; the
  // driver then sends the UTC day (useUTC). East of UTC this used to be 2026-08-31.
  const sent = DateUtils.mixedDateToDate('2026-09-01', true);

  assert.equal(sent.toISOString().slice(0, 10), '2026-09-01');
  assert.equal(DateUtils.mixedDateToDateString(sent, { utc: true }), '2026-09-01');
});
