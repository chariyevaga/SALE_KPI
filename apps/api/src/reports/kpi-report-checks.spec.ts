import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TigerTables } from '../tiger/tiger-tables.js';
import { compareReportSource, type ReportSource } from './kpi-report-checks.js';

const expected = {
  database: 'Lorem',
  tables: new TigerTables(3, 1),
  sharedCustomerCodes: ['120.99361279916'],
  periods: [1],
};

function periodViews(periods: number[]): ReportSource['periodViews'] {
  return periods.flatMap((period) => {
    const nr = String(period).padStart(2, '0');

    return [
      { view: 'tiger_invoice', database: 'Lorem', table: `LG_003_${nr}_INVOICE` },
      { view: 'tiger_stline', database: 'Lorem', table: `LG_003_${nr}_STLINE` },
    ];
  });
}

function source(overrides: Partial<ReportSource> = {}): ReportSource {
  return {
    synonyms: [
      { name: 'tiger_clcard', database: 'Lorem', schema: 'dbo', table: 'LG_003_CLCARD' },
      { name: 'tiger_items', database: 'Lorem', schema: 'dbo', table: 'LG_003_ITEMS' },
    ],
    settings: { firm: 3, sharedCustomerCodes: '120.99361279916' },
    periodViews: periodViews([1]),
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

void test('stops when the period views or synonyms read another firm, period or database', () => {
  const [clcard, items] = source().synonyms;
  const problems = compareReportSource(
    source({
      synonyms: [{ ...clcard!, database: null }, items!],
      periodViews: [
        { view: 'tiger_invoice', database: 'Lorem', table: 'LG_001_01_INVOICE' },
        { view: 'tiger_stline', database: 'DBHTJ', table: 'LG_003_01_STLINE' },
      ],
    }),
    expected,
  );

  assert.deepEqual(problems.errors, [
    'dbo.tiger_invoice reads lorem.dbo.lg_001_01_invoice instead of lorem.dbo.lg_003_01_invoice',
    'dbo.tiger_stline reads dbhtj.dbo.lg_003_01_stline instead of lorem.dbo.lg_003_01_stline',
    'dbo.tiger_clcard points to ?.dbo.LG_003_CLCARD instead of Lorem.dbo.LG_003_CLCARD',
  ]);
});

void test('stops when an object or the settings row is missing', () => {
  const problems = compareReportSource(
    source({ synonyms: source().synonyms.slice(1), settings: null, periodViews: [] }),
    expected,
  );

  assert.deepEqual(problems.errors, [
    'dbo.tiger_invoice is missing or reads no Tiger table',
    'dbo.tiger_stline is missing or reads no Tiger table',
    'dbo.tiger_clcard is missing',
    'dbo.kpi_report_settings returns no row',
  ]);
});

void test('the period views must read every configured period, no more and no less (ADR-054)', () => {
  const twoPeriods = { ...expected, periods: [1, 2] };

  assert.deepEqual(
    compareReportSource(source({ periodViews: periodViews([1, 2]) }), twoPeriods).errors,
    [],
  );
  // Period 2 was configured but the views were built before: its customers would be new.
  assert.deepEqual(compareReportSource(source(), twoPeriods).errors, [
    'dbo.tiger_invoice reads lorem.dbo.lg_003_01_invoice instead of lorem.dbo.lg_003_01_invoice, lorem.dbo.lg_003_02_invoice',
    'dbo.tiger_stline reads lorem.dbo.lg_003_01_stline instead of lorem.dbo.lg_003_01_stline, lorem.dbo.lg_003_02_stline',
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

void test('the item cards of the item group KPIs must come from the configured firm', () => {
  const synonyms = source().synonyms.map((row) =>
    row.name === 'tiger_items' ? { ...row, table: 'LG_001_ITEMS' } : row,
  );

  assert.deepEqual(compareReportSource(source({ synonyms }), expected).errors, [
    'dbo.tiger_items points to Lorem.dbo.LG_001_ITEMS instead of Lorem.dbo.LG_003_ITEMS',
  ]);
});
