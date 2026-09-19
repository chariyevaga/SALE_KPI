import type { DataSource } from 'typeorm';

import type { TigerTables } from './tiger-tables.js';

/**
 * Startup checks that keep KPI calculations on the right Logo company (ADR-037). They
 * run in schema-check: a source mismatch fails the stack, risky states only warn.
 */

/** Database a KPI_DB view reads, from `FROM [Lorem].[dbo].…` or `FROM Lorem.dbo.…`. */
export function readViewSourceDatabase(definition: string): string | null {
  const match =
    /\bFROM\s+(\[(?:[^\]]|\]\])+\]|[A-Za-z_][\w@$#]*)\s*\.\s*(?:\[dbo\]|dbo)\s*\./i.exec(
      definition,
    );
  const name = match?.[1];

  if (!name) {
    return null;
  }

  return name.startsWith('[') ? name.slice(1, -1).replaceAll(']]', ']') : name;
}

/**
 * `dbo.stores` and `dbo.erp_employees` are created by a migration with the Tiger database
 * name baked in. When TIGER_DB_NAME later points elsewhere, stores and salespeople would
 * silently come from one company and sales from another.
 */
export async function findViewSourceMismatches(
  kpi: DataSource,
  tigerDatabase: string,
): Promise<string[]> {
  const rows = await kpi.query<Array<{ name: string; definition: string | null }>>(`
    SELECT v.[name], OBJECT_DEFINITION(v.[object_id]) AS [definition]
    FROM sys.views v
    JOIN sys.schemas s ON s.[schema_id] = v.[schema_id]
    WHERE s.[name] = N'dbo' AND v.[name] IN (N'stores', N'erp_employees')
  `);

  return rows.flatMap((row) => {
    const source = row.definition ? readViewSourceDatabase(row.definition) : null;

    return source?.toLowerCase() === tigerDatabase.toLowerCase()
      ? []
      : [`dbo.${row.name} reads ${source ?? 'an unknown database'}`];
  });
}

export interface TigerPeriod {
  beginDate: Date;
  endDate: Date;
}

/** The configured firm and period exist: an L_CAPIPERIOD row and its sales tables. */
export async function readTigerPeriod(
  tiger: DataSource,
  tables: TigerTables,
): Promise<TigerPeriod> {
  const periods = await tiger.query<Array<{ BEGDATE: Date; ENDDATE: Date }>>(
    'SELECT [BEGDATE], [ENDDATE] FROM [dbo].[L_CAPIPERIOD] WHERE [FIRMNR] = @0 AND [NR] = @1',
    [tables.firm, tables.period],
  );
  const period = periods[0];

  if (!period) {
    throw new Error(
      `Tiger has no period ${tables.period} for firm ${tables.firm} in L_CAPIPERIOD; check FIRM_NR and TIGER_PERIOD_NR.`,
    );
  }

  const required = [
    tables.periodTable('INVOICE'),
    tables.periodTable('STLINE'),
    tables.firmTable('CLCARD'),
  ];
  const [found] = await tiger.query<Array<Record<string, number | null>>>(
    `SELECT OBJECT_ID(@0, 'U') AS [t0], OBJECT_ID(@1, 'U') AS [t1], OBJECT_ID(@2, 'U') AS [t2]`,
    required.map((table) => `dbo.${table}`),
  );
  const missing = required.filter((_, index) => !found?.[`t${index}`]);

  if (missing.length > 0) {
    throw new Error(`Tiger tables are missing: ${missing.join(', ')}.`);
  }

  return { beginDate: period.BEGDATE, endDate: period.ENDDATE };
}

/** Rights the Tiger account holds beyond reading; KPI code never writes Tiger. */
export async function findTigerWriteRights(tiger: DataSource): Promise<string[]> {
  const rows = await tiger.query<Array<Record<string, number | null>>>(`
    SELECT
      IS_SRVROLEMEMBER('sysadmin') AS [sysadmin],
      IS_ROLEMEMBER('db_owner') AS [db_owner],
      IS_ROLEMEMBER('db_datawriter') AS [db_datawriter],
      HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'INSERT') AS [INSERT],
      HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'UPDATE') AS [UPDATE],
      HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'DELETE') AS [DELETE]
  `);

  return Object.entries(rows[0] ?? {})
    .filter(([, value]) => value === 1)
    .map(([right]) => right);
}

/** Configured shared cash account codes that are not customers of the configured firm. */
export async function findUnknownCustomerCodes(
  tiger: DataSource,
  tables: TigerTables,
  codes: readonly string[],
): Promise<string[]> {
  if (codes.length === 0) {
    return [];
  }

  const placeholders = codes.map((_, index) => `@${index}`).join(', ');
  const rows = await tiger.query<Array<{ CODE: string }>>(
    `SELECT [CODE] FROM [dbo].${tables.firmTable('CLCARD')} WHERE [CODE] IN (${placeholders})`,
    [...codes],
  );
  const found = new Set(rows.map((row) => row.CODE));

  return codes.filter((code) => !found.has(code));
}

export interface StaleReferences {
  /** Template rows whose store selection is not a workplace of the configured firm. */
  templateStores: Array<{ template: string; code: string; storeId: string }>;
  /** Employees linked to a salesperson that does not belong to the configured firm. */
  employees: Array<{ username: string; erpEmployeeId: number }>;
}

/** References that pointed at another firm's Tiger records; they need re-selecting. */
export async function findStaleReferences(kpi: DataSource, firm: number): Promise<StaleReferences> {
  const templateStores = await kpi.query<StaleReferences['templateStores']>(
    `
      SELECT t.[name] AS [template], d.[code], s.[value] AS [storeId]
      FROM [dbo].[kpi_template_items] i
      JOIN [dbo].[kpi_templates] t ON t.[id] = i.[template_id]
      JOIN [dbo].[kpi_definitions] d ON d.[id] = i.[kpi_definition_id]
      CROSS APPLY OPENJSON(i.[input_values], '$.storeIds') s
      WHERE NOT EXISTS (
        SELECT 1 FROM [dbo].[stores] st
        WHERE st.[firm_nr] = @0 AND st.[id] = TRY_CAST(s.[value] AS int)
      )
      ORDER BY t.[name], i.[sort_order]
    `,
    [firm],
  );
  const employees = await kpi.query<StaleReferences['employees']>(
    `
      SELECT e.[username], e.[erp_employee_id] AS [erpEmployeeId]
      FROM [dbo].[employees] e
      WHERE e.[erp_employee_id] IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM [dbo].[erp_employees] x
          WHERE x.[firm_nr] = @0 AND x.[id] = e.[erp_employee_id]
        )
      ORDER BY e.[username]
    `,
    [firm],
  );

  return { templateStores, employees };
}
