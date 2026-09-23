import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { CreateKpiResults1799703800000 } from '../database/migrations/1799703800000-create-kpi-results.js';

async function run(step: 'up' | 'down'): Promise<string[]> {
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<void> {
      statements.push(sql);

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new CreateKpiResults1799703800000()[step](queryRunner);

  return statements;
}

function find(statements: string[], needle: string): string {
  return statements.find((sql) => sql.includes(needle)) ?? '';
}

void test('the results table carries the score columns and the record trail', async () => {
  const sql = find(await run('up'), 'CREATE TABLE [dbo].[kpi_results]');

  assert.match(sql, /\[id\] uniqueidentifier NOT NULL/);
  assert.match(sql, /CONSTRAINT \[PK_kpi_results\] PRIMARY KEY \(\[id\]\)/);

  for (const column of [
    'target_value',
    'actual_value',
    'source',
    'raw_achievement',
    'capped_achievement',
    'weight',
    'weighted_score',
    'calculated_at',
    'created_at',
    'created_by',
    'updated_at',
    'updated_by',
  ]) {
    assert.ok(sql.includes(`[${column}]`), column);
  }

  for (const actor of ['created_by', 'updated_by']) {
    assert.match(
      sql,
      new RegExp(
        `CONSTRAINT \\[FK_kpi_results_${actor}\\]\\s+FOREIGN KEY \\(\\[${actor}\\]\\) REFERENCES \\[dbo\\]\\.\\[employees\\] \\(\\[id\\]\\)`,
      ),
      actor,
    );
  }
});

void test('a result hangs on its plan and holds a single row', async () => {
  const statements = await run('up');
  const table = find(statements, 'CREATE TABLE [dbo].[kpi_results]');

  assert.match(table, /REFERENCES \[dbo\]\.\[kpi_assignments\] \(\[id\]\) ON DELETE CASCADE/);
  assert.match(table, /REFERENCES \[dbo\]\.\[kpi_assignment_items\] \(\[id\]\)/);
  assert.ok(
    statements.some(
      (sql) =>
        sql.includes('CREATE UNIQUE INDEX [UX_kpi_results_item]') &&
        sql.includes('([assignment_item_id])'),
    ),
  );
});

void test('the score columns keep their range, the raw achievement does not', async () => {
  const sql = find(await run('up'), 'CREATE TABLE [dbo].[kpi_results]');

  assert.match(sql, /CHECK \(\[source\] IN \(N'calculated', N'manual'\)\)/);
  assert.match(sql, /\[capped_achievement\] >= 0 AND \[capped_achievement\] <= 100/);
  assert.match(sql, /\[weighted_score\] >= 0 AND \[weighted_score\] <= 100/);
  // Raw achievement may pass 100 and may be negative, so it has no CHECK.
  assert.ok(!sql.includes('[raw_achievement] >='));
});

void test('the plan gets its total score columns', async () => {
  const sql = find(await run('up'), 'ALTER TABLE [dbo].[kpi_assignments] ADD');

  for (const column of ['total_score', 'scored_item_count', 'score_calculated_at']) {
    assert.ok(sql.includes(`[${column}]`), column);
  }

  assert.match(sql, /\[total_score\] >= 0 AND \[total_score\] <= 100/);
});

void test('the month function reads the report documents view for one month', async () => {
  const sql = find(await run('up'), 'CREATE FUNCTION [dbo].[kpi_month_values]');

  assert.match(sql, /\(@month_start date\)/);
  assert.match(sql, /RETURNS TABLE/);
  assert.match(sql, /FROM \[dbo\]\.\[kpi_report_documents\] d/);
  assert.match(sql, /WHERE d\.\[month_start\] = @month_start/);
  // Every measure of the reports, for stores and for salespeople.
  for (const code of [
    'STORE_SALES',
    'STORE_RECEIPTS',
    'STORE_CUSTOMERS',
    'STORE_NEW_CUSTOMERS',
    'STORE_RETURNING_CUSTOMERS',
    'STORE_PRODUCT_VARIETY',
    'EMPLOYEE_SALES',
    'EMPLOYEE_PRODUCT_VARIETY',
  ]) {
    assert.ok(sql.includes(`N'${code}'`), code);
  }

  assert.ok(sql.includes("N'TMT'") && sql.includes("N'USD'"));
  // Sales without a salesperson count for stores only.
  assert.match(sql, /d\.\[salesman_ref\] IS NOT NULL/);
});

void test('down removes everything it added, the function last', async () => {
  const statements = await run('down');

  assert.ok(statements.some((sql) => sql.includes('DROP COLUMN [total_score]')));
  assert.ok(statements.some((sql) => sql.includes('DROP TABLE [dbo].[kpi_results]')));
  assert.match(
    statements[statements.length - 1] ?? '',
    /DROP FUNCTION \[dbo\]\.\[kpi_month_values\]/,
  );
});
