import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { AddItemGroupSales1799704000000 } from '../database/migrations/1799704000000-add-item-group-sales.js';
import { parseKpiInputSchema } from '../kpi-definitions/kpi-input-schema.js';
import { KPI_GROUP_REPORT_CODES, KPI_GROUP_REPORT_OBJECTS } from '../reports/kpi-report-checks.js';

const ENVIRONMENT = {
  KPI_DB_HOST: 'sql.local',
  KPI_DB_PORT: '1433',
  KPI_DB_NAME: 'KPI_DB',
  KPI_DB_USER: 'kpi',
  KPI_DB_PASSWORD: 'secret',
  TIGER_DB_HOST: 'SQL.local',
  TIGER_DB_PORT: '1433',
  TIGER_DB_NAME: 'Lorem',
  TIGER_DB_USER: 'tiger',
  TIGER_DB_PASSWORD: 'secret',
  FIRM_NR: '3',
  TIGER_PERIOD_NR: '1',
};

interface Statement {
  sql: string;
  parameters: unknown[] | undefined;
}

async function run(
  step: 'up' | 'down',
  overrides: Partial<Record<keyof typeof ENVIRONMENT, string>> = {},
): Promise<Statement[]> {
  const values: Record<string, string> = { ...ENVIRONMENT, ...overrides };
  const previous = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));
  const statements: Statement[] = [];
  const queryRunner = {
    query(sql: string, parameters?: unknown[]): Promise<void> {
      statements.push({ sql, parameters });

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  Object.assign(process.env, values);

  try {
    await new AddItemGroupSales1799704000000()[step](queryRunner);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }

  return statements;
}

/** `dbo.name` of every synonym, view and function the statements create. */
function created(statements: Statement[]): string[] {
  return statements.flatMap(({ sql }) => {
    const match = /CREATE(?: OR ALTER)?\s+(?:SYNONYM|VIEW|FUNCTION)\s+\[dbo\]\.\[([^\]]+)\]/.exec(
      sql,
    );

    return match ? [`dbo.${match[1]}`] : [];
  });
}

void test('creates every item group object schema-check requires', async () => {
  const statements = await run('up');

  assert.deepEqual(
    created(statements).sort(),
    KPI_GROUP_REPORT_OBJECTS.map((object) => object.name).sort(),
  );

  for (const code of KPI_GROUP_REPORT_CODES) {
    assert.ok(created(statements).includes(`dbo.report_${code}`), code);
  }
});

void test('the item card synonym follows FIRM_NR', async () => {
  const synonym = (await run('up', { FIRM_NR: '12' })).find(({ sql }) =>
    sql.startsWith('CREATE SYNONYM [dbo].[tiger_items]'),
  );

  assert.equal(synonym?.sql, 'CREATE SYNONYM [dbo].[tiger_items] FOR [Lorem].[dbo].[LG_012_ITEMS]');
});

void test('refuses to build the views across SQL Server instances', async () => {
  await assert.rejects(run('up', { TIGER_DB_HOST: 'other.local' }), /same SQL Server host/);
});

void test('spreads the invoice revenue over its material lines by LINENET', async () => {
  const lines =
    (await run('up')).find(({ sql }) => sql.includes('VIEW [dbo].[kpi_report_group_lines]'))?.sql ??
    '';

  assert.match(lines, /i\.\[NETTOTAL\] - i\.\[TOTALVAT\] AS \[invoice_tmt\]/);
  assert.match(lines, /i\.\[REPORTNET\] AS \[invoice_usd\]/);
  assert.match(lines, /SUM\(l\.\[LINENET\]\) OVER \(PARTITION BY i\.\[LOGICALREF\]\)/);
  assert.match(lines, /l\.\[LINETYPE\] = 0/);
  assert.match(lines, /i\.\[TRCODE\] IN \(2, 7\)/);
  assert.match(lines, /\[line_net\] \/ NULLIF\(\[invoice_line_net\], 0\)/);
});

void test('lists only non-empty group codes, trimmed and upper-case', async () => {
  const view =
    (await run('up')).find(({ sql }) => sql.includes('VIEW [dbo].[item_groups]'))?.sql ?? '';

  assert.match(view, /NULLIF\(UPPER\(LTRIM\(RTRIM\(CAST\(it\.\[STGRPCODE\]/);
  assert.match(view, /WHERE g\.\[code\] IS NOT NULL/);
});

void test('seeds the two definitions with valid input schemas', async () => {
  const inserts = (await run('up')).filter(({ sql }) =>
    sql.includes('INSERT INTO [dbo].[kpi_definitions]'),
  );
  const definitions = inserts.map(({ parameters }) => ({
    code: parameters?.[0],
    scope: parameters?.[1],
    inputSchema: parseKpiInputSchema(JSON.parse(String(parameters?.[5]))),
    sortOrder: parameters?.[6],
  }));

  assert.deepEqual(
    definitions.map(({ code, scope, sortOrder, inputSchema }) => ({
      code,
      scope,
      sortOrder,
      keys: inputSchema.map((field) => field.key),
    })),
    [
      {
        code: 'STORE_GROUP_SALES',
        scope: 'store',
        sortOrder: 150,
        keys: ['storeIds', 'groupCodes', 'currency'],
      },
      // Employee KPIs have no store filter (docs/BUSINESS_RULES.md "Organizasyon").
      {
        code: 'EMPLOYEE_GROUP_SALES',
        scope: 'employee',
        sortOrder: 160,
        keys: ['groupCodes', 'currency'],
      },
    ],
  );

  const groups = definitions[0]?.inputSchema.find((field) => field.key === 'groupCodes');

  assert.deepEqual(groups && 'source' in groups ? [groups.source, groups.multiple] : [], [
    'itemGroups',
    true,
  ]);
});

void test('down removes the definitions first and the synonym last', async () => {
  const statements = (await run('down')).map(({ sql }) => sql.trim());

  assert.match(statements[0] ?? '', /DELETE FROM \[dbo\]\.\[kpi_definitions\]/);
  assert.equal(statements.at(-1), 'DROP SYNONYM IF EXISTS [dbo].[tiger_items]');
  assert.ok(statements.includes('DROP FUNCTION IF EXISTS [dbo].[kpi_month_group_values]'));
});
