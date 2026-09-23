import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { AddStoreVisitorCounts1799703900000 } from '../database/migrations/1799703900000-add-store-visitor-counts.js';
import { isFutureVisitDate, visitMonth } from './store-visitor-count-rules.js';

async function run(step: 'up' | 'down'): Promise<string[]> {
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<void> {
      statements.push(sql);

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new AddStoreVisitorCounts1799703900000()[step](queryRunner);

  return statements;
}

void test('a visit date belongs to the KPI month it falls in', () => {
  assert.deepEqual(visitMonth('2026-09-21'), { year: 2026, month: 9 });
  assert.deepEqual(visitMonth('2026-12-31'), { year: 2026, month: 12 });
});

void test('today and, for time zones ahead of UTC, tomorrow are accepted; later days are not', () => {
  // 19:30 UTC is already the next day in Ashgabat (UTC+5).
  const now = new Date('2026-09-21T19:30:00Z');

  assert.equal(isFutureVisitDate('2026-09-01', now), false);
  assert.equal(isFutureVisitDate('2026-09-21', now), false);
  assert.equal(isFutureVisitDate('2026-09-22', now), false);
  assert.equal(isFutureVisitDate('2026-09-23', now), true);
  assert.equal(isFutureVisitDate('2027-01-01', now), true);
});

void test('the migration adds the employee flag off by default', async () => {
  const statements = await run('up');

  assert.ok(
    statements.some(
      (sql) =>
        sql.includes('ALTER TABLE [dbo].[employees] ADD') &&
        sql.includes('[can_enter_visitor_counts] bit NOT NULL') &&
        sql.includes('[DF_employees_can_enter_visitor_counts] DEFAULT 0'),
    ),
  );
});

void test('the visitor count table carries the record trail and one row per store and day', async () => {
  const statements = await run('up');
  const table = statements.find((sql) => sql.includes('CREATE TABLE [dbo].[store_visitor_counts]'));

  assert.ok(table);
  assert.match(table, /CONSTRAINT \[PK_store_visitor_counts\] PRIMARY KEY \(\[id\]\)/);
  assert.match(table, /\[visit_date\] date NOT NULL/);
  assert.match(table, /CHECK \(\[visitor_count\] >= 0 AND \[visitor_count\] <= 1000000\)/);

  for (const column of ['created_at', 'created_by', 'updated_at', 'updated_by']) {
    assert.ok(table.includes(`[${column}]`), column);
  }

  for (const actor of ['created_by', 'updated_by']) {
    assert.match(
      table,
      new RegExp(
        `CONSTRAINT \\[FK_store_visitor_counts_${actor}\\]\\s+FOREIGN KEY \\(\\[${actor}\\]\\) REFERENCES \\[dbo\\]\\.\\[employees\\] \\(\\[id\\]\\)`,
      ),
      actor,
    );
  }

  assert.ok(
    statements.some(
      (sql) =>
        sql.includes('CREATE UNIQUE INDEX [UX_store_visitor_counts_store_date]') &&
        sql.includes('([store_id], [visit_date])'),
    ),
  );
});

void test('down removes the table before the employee flag', async () => {
  const statements = await run('down');

  assert.match(statements[0] ?? '', /DROP TABLE \[dbo\]\.\[store_visitor_counts\]/);
  assert.match(statements.at(-1) ?? '', /DROP COLUMN \[can_enter_visitor_counts\]/);
});
