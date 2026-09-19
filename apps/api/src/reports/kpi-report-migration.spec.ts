import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { CreateKpiReportViews1799703500000 } from '../database/migrations/1799703500000-create-kpi-report-views.js';
import { KPI_REPORT_CODES, KPI_REPORT_OBJECTS } from './kpi-report-checks.js';

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
  TIGER_SHARED_CUSTOMER_CODES: '120.99361279916',
};

async function run(
  step: 'up' | 'down',
  overrides: Partial<Record<keyof typeof ENVIRONMENT, string>> = {},
): Promise<string[]> {
  const values: Record<string, string> = { ...ENVIRONMENT, ...overrides };
  const previous = Object.fromEntries(Object.keys(values).map((name) => [name, process.env[name]]));
  const statements: string[] = [];
  const queryRunner = {
    query(sql: string): Promise<void> {
      statements.push(sql);

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  Object.assign(process.env, values);

  try {
    await new CreateKpiReportViews1799703500000()[step](queryRunner);
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

/** `dbo.name` of every synonym, view and procedure the statements create or drop. */
function objects(statements: string[], verb: RegExp): string[] {
  return statements.flatMap((sql) => {
    const match = new RegExp(
      `${verb.source}\\s+(?:SYNONYM|VIEW|PROCEDURE)\\s+(?:IF EXISTS\\s+)?\\[dbo\\]\\.\\[([^\\]]+)\\]`,
    ).exec(sql);

    return match ? [`dbo.${match[1]}`] : [];
  });
}

void test('creates every report object schema-check requires, one report view per KPI code', async () => {
  const created = objects(await run('up'), /CREATE(?: OR ALTER)?/);

  assert.deepEqual([...created].sort(), KPI_REPORT_OBJECTS.map((object) => object.name).sort());
  assert.deepEqual(
    created.filter((name) => name.startsWith('dbo.report_')),
    KPI_REPORT_CODES.map((code) => `dbo.report_${code}`),
  );
});

void test('points the synonyms at the configured database, firm and period', async () => {
  const statements = await run('up', {
    TIGER_DB_NAME: 'Tiger]DB',
    FIRM_NR: '7',
    TIGER_PERIOD_NR: '12',
  });

  assert.ok(
    statements.includes(
      'CREATE SYNONYM [dbo].[tiger_invoice] FOR [Tiger]]DB].[dbo].[LG_007_12_INVOICE]',
    ),
  );
  assert.ok(
    statements.includes(
      'CREATE SYNONYM [dbo].[tiger_stline] FOR [Tiger]]DB].[dbo].[LG_007_12_STLINE]',
    ),
  );
  assert.ok(
    statements.includes(
      'CREATE SYNONYM [dbo].[tiger_clcard] FOR [Tiger]]DB].[dbo].[LG_007_CLCARD]',
    ),
  );
});

void test('builds the settings view from FIRM_NR and the shared cash accounts, quoted', async () => {
  const statements = await run('up', {
    FIRM_NR: '7',
    TIGER_SHARED_CUSTOMER_CODES: " 120.1 , O'NEIL,120.1",
  });
  const settings = statements.find((sql) => sql.includes('[dbo].[kpi_report_settings]'));

  assert.match(settings ?? '', /CAST\(7 AS int\) AS \[firm_nr\]/);
  assert.match(
    settings ?? '',
    /CAST\(N'120\.1,O''NEIL' AS nvarchar\(4000\)\) AS \[shared_customer_codes\]/,
  );
});

void test('every report reads its own KPI and shows months -12 to -1, oldest first', async () => {
  const statements = await run('up');

  for (const code of KPI_REPORT_CODES) {
    const sql = statements.find((statement) => statement.includes(`[dbo].[report_${code}]`)) ?? '';
    const months = [...sql.matchAll(/AS \[-(\d+)_AY_[A-Z_]+\]/g)].map((match) => Number(match[1]));

    assert.match(sql, new RegExp(`r\\.\\[kpi_code\\] = N'${code}'`), code);
    assert.deepEqual(months, [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], code);
    assert.equal(sql.includes('[PARA_BIRIMI]'), code.endsWith('_SALES'), code);
    assert.equal(sql.includes('[SATIS_ELEMANI_KODU]'), code.startsWith('EMPLOYEE_'), code);
    assert.equal(sql.includes('[SUBE_NR]'), code.startsWith('STORE_'), code);

    for (const column of ['AY_SAYISI', 'ORTALAMA', 'ULASILABILIR_MAX_HEDEF', 'ONERILEN_HEDEF']) {
      assert.ok(sql.includes(`AS [${column}]`), `${code} ${column}`);
    }
  }
});

void test('refuses to build cross-database views across SQL Server instances', async () => {
  await assert.rejects(run('up', { TIGER_DB_HOST: 'other-host' }), /same SQL Server host and port/);
  await assert.rejects(run('up', { TIGER_DB_PORT: '1434' }), /same SQL Server host and port/);
});

void test('down drops everything up creates', async () => {
  const created = objects(await run('up'), /CREATE(?: OR ALTER)?/);
  const dropped = objects(await run('down'), /DROP/);

  assert.deepEqual([...dropped].sort(), [...created].sort());
});
