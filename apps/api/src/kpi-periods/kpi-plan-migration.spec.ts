import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { CreateKpiPeriodsAndAssignments1799703600000 } from '../database/migrations/1799703600000-create-kpi-periods-and-assignments.js';

const TABLES = ['kpi_periods', 'kpi_assignments', 'kpi_assignment_items'] as const;

async function run(step: 'up' | 'down'): Promise<string[]> {
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<void> {
      statements.push(sql);

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new CreateKpiPeriodsAndAssignments1799703600000()[step](queryRunner);

  return statements;
}

function tableSql(statements: string[], table: string): string {
  return statements.find((sql) => sql.includes(`CREATE TABLE [dbo].[${table}]`)) ?? '';
}

void test('creates the three plan tables with a GUID primary key', async () => {
  const statements = await run('up');

  for (const table of TABLES) {
    const sql = tableSql(statements, table);

    assert.match(sql, /\[id\] uniqueidentifier NOT NULL/, table);
    assert.match(sql, new RegExp(`CONSTRAINT \\[PK_${table}\\] PRIMARY KEY \\(\\[id\\]\\)`), table);
  }
});

void test('every plan table carries the record trail columns and their foreign keys', async () => {
  const statements = await run('up');

  for (const table of TABLES) {
    const sql = tableSql(statements, table);

    for (const column of ['created_at', 'created_by', 'updated_at', 'updated_by']) {
      assert.ok(sql.includes(`[${column}]`), `${table}.${column}`);
    }

    for (const actor of ['created_by', 'updated_by']) {
      assert.match(
        sql,
        new RegExp(
          `CONSTRAINT \\[FK_${table}_${actor}\\]\\s+FOREIGN KEY \\(\\[${actor}\\]\\) REFERENCES \\[dbo\\]\\.\\[employees\\] \\(\\[id\\]\\)`,
        ),
        `${table}.${actor}`,
      );
    }
  }
});

void test('a period is one month and can only be open or closed', async () => {
  const sql = tableSql(await run('up'), 'kpi_periods');

  assert.match(sql, /CHECK \(\[month\] BETWEEN 1 AND 12\)/);
  assert.match(sql, /CHECK \(\[year\] BETWEEN 2000 AND 2100\)/);
  assert.match(sql, /CHECK \(\[status\] IN \(N'open', N'closed'\)\)/);
  assert.match(sql, /\[status\] = N'closed' AND \[closed_at\] IS NOT NULL/);
});

void test('an employee has at most one plan per period', async () => {
  const statements = await run('up');

  assert.ok(
    statements.some(
      (sql) =>
        sql.includes('CREATE UNIQUE INDEX [UX_kpi_assignments_period_employee]') &&
        sql.includes('([period_id], [employee_id])'),
    ),
  );
});

void test('plan rows hang on their plan and keep the template checks', async () => {
  const sql = tableSql(await run('up'), 'kpi_assignment_items');

  assert.match(sql, /REFERENCES \[dbo\]\.\[kpi_assignments\] \(\[id\]\) ON DELETE CASCADE/);
  assert.match(sql, /CHECK \(\[weight\] > 0 AND \[weight\] <= 100\)/);
  assert.match(sql, /CHECK \(\[target_value\] IS NULL OR \[target_value\] >= 0\)/);
  assert.match(sql, /ISJSON\(\[input_values\]\) = 1/);
});

void test('down drops the tables children first', async () => {
  const dropped = (await run('down')).map((sql) => /DROP TABLE \[dbo\]\.\[(\w+)\]/.exec(sql)?.[1]);

  assert.deepEqual(dropped, ['kpi_assignment_items', 'kpi_assignments', 'kpi_periods']);
});
