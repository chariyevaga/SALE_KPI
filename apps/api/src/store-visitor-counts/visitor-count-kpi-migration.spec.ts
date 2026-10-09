import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { AddStoreVisitorCountKpi1799705000000 } from '../database/migrations/1799705000000-add-store-visitor-count-kpi.js';
import { parseKpiInputSchema, parseLocalizedText } from '../kpi-definitions/kpi-input-schema.js';
import {
  KPI_VISITOR_COUNT_CODES,
  KPI_VISITOR_COUNT_REPORT_OBJECTS,
} from '../reports/kpi-report-checks.js';

interface Statement {
  sql: string;
  parameters: unknown[] | undefined;
}

async function run(step: 'up' | 'down'): Promise<Statement[]> {
  const statements: Statement[] = [];
  const queryRunner = {
    query(sql: string, parameters?: unknown[]): Promise<void> {
      statements.push({ sql, parameters });

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new AddStoreVisitorCountKpi1799705000000()[step](queryRunner);

  return statements;
}

/** `dbo.name` of every view and function the statements create, the summary aside. */
function created(statements: Statement[]): string[] {
  return statements.flatMap(({ sql }) => {
    const match = /CREATE(?: OR ALTER)?\s+(?:VIEW|FUNCTION)\s+\[dbo\]\.\[([^\]]+)\]/.exec(sql);

    return match && match[1] !== 'kpi_report_summary' ? [`dbo.${match[1]}`] : [];
  });
}

void test('creates every visitor count object schema-check requires', async () => {
  assert.deepEqual(
    created(await run('up')).sort(),
    KPI_VISITOR_COUNT_REPORT_OBJECTS.map((object) => object.name).sort(),
  );
});

void test('adds STORE_VISITOR_COUNT as #16 without moving the numbers in use', async () => {
  const insert = (await run('up')).find(({ sql }) =>
    sql.includes('INSERT INTO [dbo].[kpi_definitions]'),
  );
  const [code, scope, unit, inputMode, name, inputSchema, sortOrder] = insert?.parameters ?? [];

  assert.deepEqual(KPI_VISITOR_COUNT_CODES, [code]);
  assert.deepEqual([scope, unit, inputMode, sortOrder], ['store', 'count', 'calculated', 160]);

  const names = parseLocalizedText(JSON.parse(name as string));

  for (const value of Object.values(names)) {
    assert.match(value, /^#16 /);
  }

  // Stores only: the target is a monthly total for one store or several together.
  assert.deepEqual(
    parseKpiInputSchema(JSON.parse(inputSchema as string)).map((field) => field.key),
    ['storeIds'],
  );
});

void test('the report summary keeps conversion and adds the visitor months', async () => {
  const summary = (await run('up')).find(({ sql }) =>
    sql.includes('CREATE OR ALTER VIEW [dbo].[kpi_report_summary]'),
  )?.sql;

  assert.ok(summary?.includes('[dbo].[kpi_report_monthly]'));
  assert.ok(summary?.includes('[dbo].[kpi_report_conversion_monthly]'));
  assert.ok(summary?.includes('[dbo].[kpi_visitor_count_monthly]'));
});

void test('down restores the summary without the visitor months and drops the rest', async () => {
  const statements = await run('down');
  const summary = statements.find(({ sql }) =>
    sql.includes('CREATE OR ALTER VIEW [dbo].[kpi_report_summary]'),
  )?.sql;

  assert.ok(statements[0]?.sql.includes('DELETE FROM [dbo].[kpi_definitions]'));
  assert.ok(summary?.includes('[dbo].[kpi_report_conversion_monthly]'));
  assert.ok(!summary?.includes('kpi_visitor_count_monthly'));
  assert.ok(
    statements.some(({ sql }) =>
      sql.includes('DROP VIEW IF EXISTS [dbo].[kpi_visitor_count_monthly]'),
    ),
  );
});
