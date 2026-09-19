import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TigerTables } from '../tiger/tiger-tables.js';
import { compareReportSource, type ReportSource } from './kpi-report-checks.js';

const expected = {
  database: 'Lorem',
  tables: new TigerTables(3, 1),
  sharedCustomerCodes: ['120.99361279916'],
};

function source(overrides: Partial<ReportSource> = {}): ReportSource {
  return {
    synonyms: [
      { name: 'tiger_invoice', database: 'Lorem', schema: 'dbo', table: 'LG_003_01_INVOICE' },
      { name: 'tiger_stline', database: 'Lorem', schema: 'dbo', table: 'LG_003_01_STLINE' },
      { name: 'tiger_clcard', database: 'Lorem', schema: 'dbo', table: 'LG_003_CLCARD' },
    ],
    settings: { firm: 3, sharedCustomerCodes: '120.99361279916' },
    ...overrides,
  };
}

void test('accepts report objects built for the configured source', () => {
  assert.deepEqual(compareReportSource(source(), expected), { errors: [], warnings: [] });
});

void test('compares synonym targets without regard to case', () => {
  const synonyms = source().synonyms.map((row) => ({ ...row, database: 'LOREM' }));

  assert.deepEqual(compareReportSource(source({ synonyms }), expected).errors, []);
});

void test('stops when the synonyms read another firm, period or database', () => {
  const [invoice, stline, clcard] = source().synonyms;
  const problems = compareReportSource(
    source({
      synonyms: [
        { ...invoice!, table: 'LG_001_01_INVOICE' },
        { ...stline!, database: 'DBHTJ' },
        { ...clcard!, database: null },
      ],
    }),
    expected,
  );

  assert.deepEqual(problems.errors, [
    'dbo.tiger_invoice points to Lorem.dbo.LG_001_01_INVOICE instead of Lorem.dbo.LG_003_01_INVOICE',
    'dbo.tiger_stline points to DBHTJ.dbo.LG_003_01_STLINE instead of Lorem.dbo.LG_003_01_STLINE',
    'dbo.tiger_clcard points to ?.dbo.LG_003_CLCARD instead of Lorem.dbo.LG_003_CLCARD',
  ]);
});

void test('stops when a synonym or the settings row is missing', () => {
  const problems = compareReportSource(
    source({ synonyms: source().synonyms.slice(1), settings: null }),
    expected,
  );

  assert.deepEqual(problems.errors, [
    'dbo.tiger_invoice is missing',
    'dbo.kpi_report_settings returns no row',
  ]);
});

void test('stops when the settings view was built for another firm', () => {
  const problems = compareReportSource(
    source({ settings: { firm: 1, sharedCustomerCodes: '120.99361279916' } }),
    expected,
  );

  assert.deepEqual(problems.errors, [
    'dbo.kpi_report_settings is built for firm 1, but FIRM_NR is 3',
  ]);
});

void test('only warns when the shared cash accounts differ', () => {
  const problems = compareReportSource(
    source({ settings: { firm: 3, sharedCustomerCodes: '' } }),
    expected,
  );

  assert.deepEqual(problems.errors, []);
  assert.equal(problems.warnings.length, 1);
  assert.match(
    problems.warnings[0]!,
    /\[\], but TIGER_SHARED_CUSTOMER_CODES is \[120\.99361279916\]/,
  );
});

void test('ignores order, spaces and repeats in the shared cash account lists', () => {
  const problems = compareReportSource(
    source({ settings: { firm: 3, sharedCustomerCodes: 'B, A,A,' } }),
    { ...expected, sharedCustomerCodes: ['A', 'B'] },
  );

  assert.deepEqual(problems, { errors: [], warnings: [] });
});
