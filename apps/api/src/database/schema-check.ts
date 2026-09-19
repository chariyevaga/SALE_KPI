import '../config/load-environment.js';
import 'reflect-metadata';

import { getFirmNumber } from '../config/environment.js';
import dataSource from './data-source.js';

const REQUIRED_OBJECTS = [
  { name: 'dbo.files', type: 'U' },
  { name: 'dbo.employees', type: 'U' },
  { name: 'dbo.device_sessions', type: 'U' },
  { name: 'dbo.kpi_definitions', type: 'U' },
  { name: 'dbo.kpi_templates', type: 'U' },
  { name: 'dbo.kpi_template_items', type: 'U' },
  { name: 'dbo.audit_logs', type: 'U' },
  { name: 'dbo.stores', type: 'V' },
  { name: 'dbo.erp_employees', type: 'V' },
] as const;

async function objectExists(name: string, type: string): Promise<boolean> {
  const rows = await dataSource.query<Array<{ object_id: number | null }>>(
    'SELECT OBJECT_ID(@0, @1) AS [object_id]',
    [name, type],
  );

  return rows[0]?.object_id !== null && rows[0]?.object_id !== undefined;
}

/** Tables without the record trail columns: audit_logs is append-only (created_* only). */
const AUDIT_COLUMN_EXEMPT_TABLES = ['typeorm_migrations', 'audit_logs'];
const AUDIT_COLUMNS = ['created_at', 'created_by', 'updated_at', 'updated_by'];

/**
 * Every table we own must carry the record trail columns (ADR-036). Checking the live
 * schema catches a new table whose migration forgot them.
 */
async function getTablesMissingAuditColumns(): Promise<string[]> {
  const rows = await dataSource.query<Array<{ table_name: string; audit_columns: number }>>(
    `
      SELECT t.[name] AS [table_name], COUNT(c.[name]) AS [audit_columns]
      FROM sys.tables t
      JOIN sys.schemas s ON s.[schema_id] = t.[schema_id]
      LEFT JOIN sys.columns c
        ON c.[object_id] = t.[object_id]
        AND c.[name] IN (@0, @1, @2, @3)
      WHERE s.[name] = N'dbo'
      GROUP BY t.[name]
    `,
    AUDIT_COLUMNS,
  );

  return rows
    .filter(
      (row) =>
        !AUDIT_COLUMN_EXEMPT_TABLES.includes(row.table_name) &&
        Number(row.audit_columns) !== AUDIT_COLUMNS.length,
    )
    .map((row) => `dbo.${row.table_name}`);
}

async function getPendingMigrationNames(): Promise<string[]> {
  const configuredNames = dataSource.migrations.map((migration) => {
    if (!migration.name) {
      throw new Error('Every configured migration must have a name.');
    }

    return migration.name;
  });

  if (!(await objectExists('dbo.typeorm_migrations', 'U'))) {
    return configuredNames;
  }

  const executed = await dataSource.query<Array<{ name: string }>>(
    'SELECT [name] FROM [dbo].[typeorm_migrations]',
  );
  const executedNames = new Set(executed.map((migration) => migration.name));

  return configuredNames.filter((name) => !executedNames.has(name));
}

async function checkSchema(): Promise<void> {
  getFirmNumber();
  await dataSource.initialize();

  try {
    const pendingMigrations = await getPendingMigrationNames();

    if (pendingMigrations.length > 0) {
      throw new Error(
        `Pending KPI_DB migrations found (${pendingMigrations.join(', ')}). Run: npm run migration:run`,
      );
    }

    const missing: string[] = [];

    for (const object of REQUIRED_OBJECTS) {
      if (!(await objectExists(object.name, object.type))) {
        missing.push(object.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Required KPI_DB tables/views are missing: ${missing.join(', ')}`);
    }

    const withoutAuditColumns = await getTablesMissingAuditColumns();

    if (withoutAuditColumns.length > 0) {
      throw new Error(
        `Tables without ${AUDIT_COLUMNS.join('/')} columns (ADR-036): ${withoutAuditColumns.join(', ')}`,
      );
    }

    console.log('KPI_DB migration, required table/view and audit column checks passed.');
  } finally {
    await dataSource.destroy();
  }
}

checkSchema().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Schema check failed: ${message}`);
  process.exitCode = 1;
});
