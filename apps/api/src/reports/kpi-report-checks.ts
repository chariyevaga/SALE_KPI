import type { DataSource } from 'typeorm';

import type { TigerTables } from '../tiger/tiger-tables.js';

/**
 * The KPI report views (`dbo.report_<KPI code>`, ADR-038) read Tiger through synonyms and a
 * settings view that their migration builds from TIGER_DB_NAME, FIRM_NR, TIGER_PERIOD_NR and
 * TIGER_SHARED_CUSTOMER_CODES. schema-check compares them with the current settings, so the
 * reports cannot silently keep reading another company after the source changes.
 */

/** KPI codes that have a `dbo.report_<code>` view (docs/REPORTS.md). */
export const KPI_REPORT_CODES = [
  'STORE_SALES',
  'EMPLOYEE_SALES',
  'STORE_RECEIPTS',
  'EMPLOYEE_RECEIPTS',
  'STORE_CUSTOMERS',
  'EMPLOYEE_CUSTOMERS',
  'STORE_NEW_CUSTOMERS',
  'EMPLOYEE_NEW_CUSTOMERS',
  'STORE_RETURNING_CUSTOMERS',
  'EMPLOYEE_RETURNING_CUSTOMERS',
  'STORE_PRODUCT_VARIETY',
  'EMPLOYEE_PRODUCT_VARIETY',
] as const;

/** Objects the report migration creates; schema-check requires every one of them. */
export const KPI_REPORT_OBJECTS: ReadonlyArray<{ name: string; type: 'SN' | 'V' | 'P' }> = [
  { name: 'dbo.tiger_invoice', type: 'SN' },
  { name: 'dbo.tiger_stline', type: 'SN' },
  { name: 'dbo.tiger_clcard', type: 'SN' },
  { name: 'dbo.kpi_report_settings', type: 'V' },
  { name: 'dbo.kpi_report_documents', type: 'V' },
  { name: 'dbo.kpi_report_monthly', type: 'V' },
  { name: 'dbo.kpi_report_summary', type: 'V' },
  ...KPI_REPORT_CODES.map((code) => ({ name: `dbo.report_${code}`, type: 'V' as const })),
  { name: 'dbo.show_report', type: 'P' },
];

export interface ReportSource {
  /** Synonyms with the parts of the object they point at (`PARSENAME`, unquoted). */
  synonyms: Array<{
    name: string;
    database: string | null;
    schema: string | null;
    table: string | null;
  }>;
  /** The single row of `dbo.kpi_report_settings`, or null when it returns none. */
  settings: { firm: number; sharedCustomerCodes: string } | null;
}

export interface ExpectedReportSource {
  database: string;
  tables: TigerTables;
  sharedCustomerCodes: readonly string[];
}

export interface ReportSourceProblems {
  /** The reports read another database, firm or period: the stack must not start. */
  errors: string[];
  /** The reports disagree with the KPI rules in a smaller way. */
  warnings: string[];
}

export async function readReportSource(kpi: DataSource): Promise<ReportSource> {
  const synonyms = await kpi.query<ReportSource['synonyms']>(`
    SELECT
      s.[name],
      PARSENAME(s.[base_object_name], 3) AS [database],
      PARSENAME(s.[base_object_name], 2) AS [schema],
      PARSENAME(s.[base_object_name], 1) AS [table]
    FROM sys.synonyms s
    WHERE s.[schema_id] = SCHEMA_ID(N'dbo')
  `);
  const settings = await kpi.query<Array<{ firm: number; sharedCustomerCodes: string }>>(
    'SELECT [firm_nr] AS [firm], [shared_customer_codes] AS [sharedCustomerCodes] FROM [dbo].[kpi_report_settings]',
  );

  return { synonyms, settings: settings[0] ?? null };
}

export function compareReportSource(
  actual: ReportSource,
  expected: ExpectedReportSource,
): ReportSourceProblems {
  const errors: string[] = [];
  const warnings: string[] = [];
  const targets = {
    tiger_invoice: expected.tables.periodTable('INVOICE'),
    tiger_stline: expected.tables.periodTable('STLINE'),
    tiger_clcard: expected.tables.firmTable('CLCARD'),
  };

  for (const [name, bracketedTable] of Object.entries(targets)) {
    const table = bracketedTable.slice(1, -1);
    const wanted = `${expected.database}.dbo.${table}`;
    const synonym = actual.synonyms.find((row) => row.name.toLowerCase() === name);

    if (!synonym) {
      errors.push(`dbo.${name} is missing`);
      continue;
    }

    const found = [synonym.database, synonym.schema, synonym.table].map((part) => part ?? '?');

    if (found.join('.').toLowerCase() !== wanted.toLowerCase()) {
      errors.push(`dbo.${name} points to ${found.join('.')} instead of ${wanted}`);
    }
  }

  if (!actual.settings) {
    errors.push('dbo.kpi_report_settings returns no row');
  } else {
    if (actual.settings.firm !== expected.tables.firm) {
      errors.push(
        `dbo.kpi_report_settings is built for firm ${actual.settings.firm}, but FIRM_NR is ${expected.tables.firm}`,
      );
    }

    const built = normalizeCodes(actual.settings.sharedCustomerCodes.split(','));
    const configured = normalizeCodes(expected.sharedCustomerCodes);

    if (built.join(',') !== configured.join(',')) {
      warnings.push(
        `the report views leave out the shared cash accounts [${built.join(', ')}], but TIGER_SHARED_CUSTOMER_CODES is [${configured.join(', ')}]. Customer reports differ from the KPI rules until a migration recreates dbo.kpi_report_settings (docs/REPORTS.md)`,
      );
    }
  }

  return { errors, warnings };
}

function normalizeCodes(codes: readonly string[]): string[] {
  return [...new Set(codes.map((code) => code.trim()).filter(Boolean))].sort();
}
