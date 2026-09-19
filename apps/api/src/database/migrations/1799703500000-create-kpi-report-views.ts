import type { MigrationInterface, QueryRunner } from 'typeorm';

import {
  getKpiDatabaseConfig,
  getTigerDatabaseConfig,
  getTigerSharedCustomerCodes,
} from '../../config/environment.js';
import { TigerTables } from '../../tiger/tiger-tables.js';

// SQL is intentionally inlined: a migration is a snapshot. A changed measure or formula is a
// new migration that recreates the affected views. Contract: docs/REPORTS.md, ADR-038.

function quoteIdentifier(value: string): string {
  if (!value || value.length > 128) {
    throw new Error('TIGER_DB_NAME must contain between 1 and 128 characters.');
  }

  return `[${value.replaceAll(']', ']]')}]`;
}

function quoteString(value: string): string {
  return `N'${value.replaceAll("'", "''")}'`;
}

/** Month columns, oldest first: 12 = twelve months before the current month, 1 = last month. */
const MONTH_OFFSETS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

const SCOPES = {
  store: {
    prefix: 'STORE',
    entity: 'd.[store_nr]',
    conditions: [],
  },
  employee: {
    prefix: 'EMPLOYEE',
    entity: 'd.[salesman_ref]',
    // Sales without a salesperson count for stores only (docs/BUSINESS_RULES.md).
    conditions: ['d.[salesman_ref] IS NOT NULL'],
  },
} as const;

type ReportScope = keyof typeof SCOPES;

/** Monthly KPI values; money measures have one value per currency, like the KPI input. */
const MEASURES = [
  { measure: 'SALES', currency: 'TMT', column: 'sales_tmt' },
  { measure: 'SALES', currency: 'USD', column: 'sales_usd' },
  { measure: 'RECEIPTS', currency: null, column: 'receipts' },
  { measure: 'CUSTOMERS', currency: null, column: 'customers' },
  { measure: 'NEW_CUSTOMERS', currency: null, column: 'new_customers' },
  { measure: 'RETURNING_CUSTOMERS', currency: null, column: 'returning_customers' },
  { measure: 'PRODUCT_VARIETY', currency: null, column: 'product_variety' },
] as const;

interface ReportView {
  code: string;
  scope: ReportScope;
  /** Month column suffix: `-12_AY_CIRO`. */
  label: string;
  money: boolean;
}

const REPORTS: ReportView[] = [
  { code: 'STORE_SALES', scope: 'store', label: 'CIRO', money: true },
  { code: 'EMPLOYEE_SALES', scope: 'employee', label: 'CIRO', money: true },
  { code: 'STORE_RECEIPTS', scope: 'store', label: 'FIS', money: false },
  { code: 'EMPLOYEE_RECEIPTS', scope: 'employee', label: 'FIS', money: false },
  { code: 'STORE_CUSTOMERS', scope: 'store', label: 'MUSTERI', money: false },
  { code: 'EMPLOYEE_CUSTOMERS', scope: 'employee', label: 'MUSTERI', money: false },
  { code: 'STORE_NEW_CUSTOMERS', scope: 'store', label: 'YENI_MUSTERI', money: false },
  { code: 'EMPLOYEE_NEW_CUSTOMERS', scope: 'employee', label: 'YENI_MUSTERI', money: false },
  { code: 'STORE_RETURNING_CUSTOMERS', scope: 'store', label: 'ESKI_MUSTERI', money: false },
  { code: 'EMPLOYEE_RETURNING_CUSTOMERS', scope: 'employee', label: 'ESKI_MUSTERI', money: false },
  { code: 'STORE_PRODUCT_VARIETY', scope: 'store', label: 'CESIT', money: false },
  { code: 'EMPLOYEE_PRODUCT_VARIETY', scope: 'employee', label: 'CESIT', money: false },
];

const HELPER_VIEWS = [
  'kpi_report_settings',
  'kpi_report_documents',
  'kpi_report_monthly',
  'kpi_report_summary',
] as const;

const SYNONYMS = ['tiger_invoice', 'tiger_stline', 'tiger_clcard'] as const;

function settingsViewSql(firm: number, sharedCustomerCodes: readonly string[]): string {
  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_settings]
    AS
    -- Tiger settings the report views were built with; schema-check compares them with .env.
    SELECT
      CAST(${firm} AS int) AS [firm_nr],
      CAST(${quoteString(sharedCustomerCodes.join(','))} AS nvarchar(4000)) AS [shared_customer_codes]
  `;
}

const DOCUMENTS_VIEW_SQL = `
  CREATE OR ALTER VIEW [dbo].[kpi_report_documents]
  AS
  -- Sales (TRCODE 7) and sales returns (TRCODE 2) of the configured firm and period, with
  -- the signs and customer flags the KPI measures need (docs/TIGER_DATA.md).
  WITH [documents] AS (
    SELECT
      i.[LOGICALREF] AS [invoice_ref],
      i.[TRCODE] AS [trcode],
      CAST(i.[DATE_] AS date) AS [sale_date],
      i.[TIME_] AS [sale_time],
      DATEFROMPARTS(YEAR(i.[DATE_]), MONTH(i.[DATE_]), 1) AS [month_start],
      i.[BRANCH] AS [store_nr],
      NULLIF(i.[SALESMANREF], 0) AS [salesman_ref],
      CASE
        WHEN i.[TRCODE] = 7
          AND i.[CLIENTREF] > 0
          AND NOT EXISTS (
            SELECT 1
            FROM [dbo].[tiger_clcard] c
            CROSS JOIN [dbo].[kpi_report_settings] s
            CROSS APPLY STRING_SPLIT(s.[shared_customer_codes], N',') x
            WHERE c.[LOGICALREF] = i.[CLIENTREF]
              AND x.[value] <> N''
              AND x.[value] = CAST(c.[CODE] AS nvarchar(17)) COLLATE DATABASE_DEFAULT
          )
        THEN i.[CLIENTREF]
      END AS [customer_ref],
      CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END AS [receipts],
      CAST(
        CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END * (i.[NETTOTAL] - i.[TOTALVAT])
        AS decimal(19, 4)
      ) AS [sales_tmt],
      CAST(CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END * i.[REPORTNET] AS decimal(19, 4)) AS [sales_usd]
    FROM [dbo].[tiger_invoice] i
    WHERE i.[CANCELLED] = 0 AND i.[TRCODE] IN (2, 7)
  )
  SELECT
    d.[invoice_ref],
    d.[trcode],
    d.[sale_date],
    d.[month_start],
    d.[store_nr],
    d.[salesman_ref],
    d.[customer_ref],
    d.[receipts],
    d.[sales_tmt],
    d.[sales_usd],
    CAST(
      CASE
        WHEN d.[customer_ref] IS NOT NULL
          AND ROW_NUMBER() OVER (
            PARTITION BY d.[customer_ref]
            ORDER BY d.[sale_date], d.[sale_time], d.[invoice_ref]
          ) = 1
        THEN 1 ELSE 0
      END AS bit
    ) AS [is_first_purchase],
    CAST(
      CASE
        WHEN d.[customer_ref] IS NOT NULL
          AND d.[sale_date] > MIN(d.[sale_date]) OVER (PARTITION BY d.[customer_ref])
        THEN 1 ELSE 0
      END AS bit
    ) AS [is_returning_visit]
  FROM [documents] d
`;

function where(conditions: readonly string[]): string {
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function scopeMonthsSql(scope: ReportScope): string {
  const { entity, conditions } = SCOPES[scope];

  return `
    [${scope}_documents] AS (
      SELECT
        ${entity} AS [entity_ref],
        d.[month_offset],
        d.[month_start],
        SUM(d.[sales_tmt]) AS [sales_tmt],
        SUM(d.[sales_usd]) AS [sales_usd],
        SUM(d.[receipts]) AS [receipts],
        COUNT(DISTINCT d.[customer_ref]) AS [customers],
        COUNT(DISTINCT CASE WHEN d.[is_first_purchase] = 1 THEN d.[customer_ref] END) AS [new_customers],
        COUNT(DISTINCT CASE WHEN d.[is_returning_visit] = 1 THEN d.[customer_ref] END) AS [returning_customers]
      FROM [documents] d
      ${where(conditions)}
      GROUP BY ${entity}, d.[month_offset], d.[month_start]
    ),
    [${scope}_variety] AS (
      SELECT ${entity} AS [entity_ref], d.[month_offset], COUNT(DISTINCT l.[STOCKREF]) AS [product_variety]
      FROM [documents] d
      JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = d.[invoice_ref]
      ${where([...conditions, 'd.[trcode] = 7', 'l.[LINETYPE] = 0'])}
      GROUP BY ${entity}, d.[month_offset]
    ),
    [${scope}_months] AS (
      SELECT
        a.[entity_ref],
        a.[month_offset],
        a.[month_start],
        a.[sales_tmt],
        a.[sales_usd],
        a.[receipts],
        a.[customers],
        a.[new_customers],
        a.[returning_customers],
        ISNULL(v.[product_variety], 0) AS [product_variety]
      FROM [${scope}_documents] a
      LEFT JOIN [${scope}_variety] v
        ON v.[entity_ref] = a.[entity_ref] AND v.[month_offset] = a.[month_offset]
    )`;
}

function monthlyViewSql(): string {
  const branches = (Object.keys(SCOPES) as ReportScope[]).flatMap((scope) =>
    MEASURES.map(
      ({ measure, currency, column }) => `
        SELECT
          CAST(N'${SCOPES[scope].prefix}_${measure}' AS nvarchar(64)) AS [kpi_code],
          CAST(m.[entity_ref] AS int) AS [entity_ref],
          CAST(${currency ? `N'${currency}'` : 'NULL'} AS nvarchar(3)) AS [currency],
          m.[month_offset],
          m.[month_start],
          CAST(m.[${column}] AS decimal(19, 4)) AS [value]
        FROM [${scope}_months] m`,
    ),
  );

  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_monthly]
    AS
    -- One row per KPI, store or salesperson, currency and month of the 12 complete months
    -- before the current month. month_offset 12 is the oldest month, 1 is last month. Months
    -- without a sales or return document have no row.
    WITH [report_period] AS (
      SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
      FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
    ),
    [documents] AS (
      SELECT
        d.[invoice_ref],
        d.[trcode],
        d.[month_start],
        d.[store_nr],
        d.[salesman_ref],
        d.[customer_ref],
        d.[receipts],
        d.[sales_tmt],
        d.[sales_usd],
        d.[is_first_purchase],
        d.[is_returning_visit],
        DATEDIFF(MONTH, d.[month_start], p.[current_month]) AS [month_offset]
      FROM [dbo].[kpi_report_documents] d
      CROSS JOIN [report_period] p
      WHERE d.[sale_date] >= p.[first_month] AND d.[sale_date] < p.[current_month]
    ),
    ${scopeMonthsSql('store')},
    ${scopeMonthsSql('employee')}
    ${branches.join('\n    UNION ALL')}
  `;
}

function summaryViewSql(): string {
  const months = MONTH_OFFSETS.map(
    (offset) =>
      `MAX(CASE WHEN r.[month_offset] = ${offset} THEN r.[value] END) AS [value_m${offset}]`,
  );

  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_summary]
    AS
    -- The 12 months side by side with statistics and target suggestions (docs/REPORTS.md):
    --   base_value            = the higher of the average and the last 3 months' average
    --   achievable_max_target = the higher of the best quarter of the months' average
    --                           (best 3 of 12, best 2 of 6, the best of up to 4) and base_value
    --   recommended_target    = halfway between base_value and achievable_max_target
    WITH [ranked] AS (
      SELECT
        m.[kpi_code],
        m.[entity_ref],
        m.[currency],
        m.[month_offset],
        m.[value],
        ROW_NUMBER() OVER (
          PARTITION BY m.[kpi_code], m.[entity_ref], m.[currency]
          ORDER BY m.[value] DESC
        ) AS [value_rank],
        COUNT(*) OVER (PARTITION BY m.[kpi_code], m.[entity_ref], m.[currency]) AS [month_count]
      FROM [dbo].[kpi_report_monthly] m
    ),
    [totals] AS (
      SELECT
        r.[kpi_code],
        r.[entity_ref],
        r.[currency],
        ${months.join(',\n        ')},
        COUNT(*) AS [month_count],
        AVG(r.[value]) AS [average_value],
        AVG(CASE WHEN r.[month_offset] <= 3 THEN r.[value] END) AS [last3_average],
        MIN(r.[value]) AS [min_value],
        MAX(r.[value]) AS [max_value],
        AVG(CASE WHEN r.[value_rank] <= CEILING(r.[month_count] / 4.0) THEN r.[value] END)
          AS [top_quarter_average]
      FROM [ranked] r
      GROUP BY r.[kpi_code], r.[entity_ref], r.[currency]
    ),
    [based] AS (
      SELECT
        t.*,
        CASE WHEN t.[last3_average] > t.[average_value] THEN t.[last3_average] ELSE t.[average_value] END
          AS [base_value]
      FROM [totals] t
    ),
    [targets] AS (
      SELECT
        b.*,
        CASE
          WHEN b.[top_quarter_average] > b.[base_value] THEN b.[top_quarter_average]
          ELSE b.[base_value]
        END AS [achievable_max_target]
      FROM [based] b
    )
    SELECT
      t.[kpi_code],
      t.[entity_ref],
      t.[currency],
      ${MONTH_OFFSETS.map((offset) => `t.[value_m${offset}]`).join(',\n      ')},
      t.[month_count],
      t.[average_value],
      t.[last3_average],
      t.[min_value],
      t.[max_value],
      t.[top_quarter_average],
      t.[base_value],
      t.[achievable_max_target],
      (t.[base_value] + t.[achievable_max_target]) / 2 AS [recommended_target]
    FROM [targets] t
  `;
}

function reportViewSql(report: ReportView): string {
  const value = report.money ? 'decimal(19, 2)' : 'int';
  const target = report.money ? 'decimal(19, 0)' : 'int';
  const entity =
    report.scope === 'store'
      ? {
          columns: [
            'CAST(s.[nr] AS int) AS [SUBE_NR]',
            'CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI]',
          ],
          from: '[dbo].[stores] s',
          firm: 's.[firm_nr]',
          ref: 's.[nr]',
        }
      : {
          columns: [
            'CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU]',
            'CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI]',
            's.[is_active] AS [AKTIF]',
          ],
          from: '[dbo].[erp_employees] s',
          firm: 's.[firm_nr]',
          ref: 's.[id]',
        };
  const columns = [
    ...entity.columns,
    ...(report.money ? ['c.[currency] AS [PARA_BIRIMI]'] : []),
    ...MONTH_OFFSETS.map(
      (offset) => `CAST(r.[value_m${offset}] AS ${value}) AS [-${offset}_AY_${report.label}]`,
    ),
    'ISNULL(r.[month_count], 0) AS [AY_SAYISI]',
    'CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA]',
    'CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA]',
    `CAST(r.[min_value] AS ${value}) AS [EN_DUSUK]`,
    `CAST(r.[max_value] AS ${value}) AS [EN_YUKSEK]`,
    `CAST(ROUND(r.[achievable_max_target], 0) AS ${target}) AS [ULASILABILIR_MAX_HEDEF]`,
    `CAST(ROUND(r.[recommended_target], 0) AS ${target}) AS [ONERILEN_HEDEF]`,
  ];

  return `
    CREATE OR ALTER VIEW [dbo].[report_${report.code}]
    AS
    SELECT
      ${columns.join(',\n      ')}
    FROM ${entity.from}
    JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = ${entity.firm}
    ${report.money ? "CROSS JOIN (VALUES (N'TMT'), (N'USD')) c([currency])" : ''}
    LEFT JOIN [dbo].[kpi_report_summary] r
      ON r.[kpi_code] = N'${report.code}'
      AND r.[entity_ref] = ${entity.ref}
      ${report.money ? 'AND r.[currency] = c.[currency]' : ''}
  `;
}

const SHOW_REPORT_PROCEDURE_SQL = `
  CREATE OR ALTER PROCEDURE [dbo].[show_report]
    @code nvarchar(64)
  AS
  -- EXEC dbo.show_report N'STORE_SALES': the report with month names in the month columns,
  -- -12_AY_CIRO -> 09_2025_CIRO. The view name is looked up, never built from the input.
  BEGIN
    SET NOCOUNT ON;

    DECLARE @view_id int = (
      SELECT v.[object_id]
      FROM sys.views v
      WHERE v.[schema_id] = SCHEMA_ID(N'dbo') AND v.[name] = N'report_' + @code
    );

    IF @view_id IS NULL
    BEGIN
      -- THROW formats its message printf-style, so a % in the input must be doubled.
      DECLARE @message nvarchar(2048) = CONCAT(
        N'Unknown report "', REPLACE(@code, N'%', N'%%'),
        N'". Use the KPI code of a dbo.report_<code> view, e.g. STORE_SALES.'
      );
      THROW 50001, @message, 1;
    END;

    DECLARE @current_month date = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    -- Rows are ordered by the columns before the first month column (store or salesperson).
    DECLARE @first_month_column int = (
      SELECT MIN(c.[column_id])
      FROM sys.columns c
      WHERE c.[object_id] = @view_id AND c.[name] LIKE N'-%[_]AY[_]%'
    );
    DECLARE @columns nvarchar(max);
    DECLARE @order nvarchar(max);

    SELECT
      @columns = STRING_AGG(
        CAST(
          CASE
            WHEN o.[month_offset] IS NULL THEN QUOTENAME(c.[name])
            ELSE QUOTENAME(c.[name]) + N' AS ' + QUOTENAME(
              RIGHT(N'0' + CAST(MONTH(m.[month]) AS nvarchar(2)), 2)
              + N'_' + CAST(YEAR(m.[month]) AS nvarchar(4))
              + SUBSTRING(c.[name], CHARINDEX(N'_AY_', c.[name]) + 3, 128)
            )
          END AS nvarchar(max)
        ),
        N', '
      ) WITHIN GROUP (ORDER BY c.[column_id]),
      @order = STRING_AGG(
        CASE WHEN c.[column_id] < @first_month_column THEN CAST(QUOTENAME(c.[name]) AS nvarchar(max)) END,
        N', '
      ) WITHIN GROUP (ORDER BY c.[column_id])
    FROM sys.columns c
    CROSS APPLY (
      SELECT CASE
        WHEN c.[name] LIKE N'-%[_]AY[_]%'
        THEN TRY_CAST(SUBSTRING(c.[name], 2, CHARINDEX(N'_', c.[name]) - 2) AS int)
      END AS [month_offset]
    ) o
    CROSS APPLY (SELECT DATEADD(MONTH, -o.[month_offset], @current_month) AS [month]) m
    WHERE c.[object_id] = @view_id;

    DECLARE @sql nvarchar(max) =
      N'SELECT ' + @columns + N' FROM [dbo].' + QUOTENAME(OBJECT_NAME(@view_id))
      + ISNULL(N' ORDER BY ' + @order, N'') + N';';

    EXEC sys.sp_executesql @sql;
  END
`;

export class CreateKpiReportViews1799703500000 implements MigrationInterface {
  name = 'CreateKpiReportViews1799703500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const kpi = getKpiDatabaseConfig();
    const tiger = getTigerDatabaseConfig();

    if (kpi.host.toLowerCase() !== tiger.host.toLowerCase() || kpi.port !== tiger.port) {
      throw new Error(
        'KPI_DB and TIGERDB must use the same SQL Server host and port for the report views.',
      );
    }

    // The report synonyms name the Logo tables of the configured firm and period (ADR-037).
    const tables = TigerTables.fromEnvironment();
    const tigerDatabase = quoteIdentifier(tiger.database);
    const synonymTargets: Record<(typeof SYNONYMS)[number], string> = {
      tiger_invoice: tables.periodTable('INVOICE'),
      tiger_stline: tables.periodTable('STLINE'),
      tiger_clcard: tables.firmTable('CLCARD'),
    };

    for (const synonym of SYNONYMS) {
      await queryRunner.query(`DROP SYNONYM IF EXISTS [dbo].[${synonym}]`);
      await queryRunner.query(
        `CREATE SYNONYM [dbo].[${synonym}] FOR ${tigerDatabase}.[dbo].${synonymTargets[synonym]}`,
      );
    }

    await queryRunner.query(settingsViewSql(tables.firm, getTigerSharedCustomerCodes()));
    await queryRunner.query(DOCUMENTS_VIEW_SQL);
    await queryRunner.query(monthlyViewSql());
    await queryRunner.query(summaryViewSql());

    for (const report of REPORTS) {
      await queryRunner.query(reportViewSql(report));
    }

    await queryRunner.query(SHOW_REPORT_PROCEDURE_SQL);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP PROCEDURE IF EXISTS [dbo].[show_report]');

    for (const report of [...REPORTS].reverse()) {
      await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[report_${report.code}]`);
    }

    for (const view of [...HELPER_VIEWS].reverse()) {
      await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[${view}]`);
    }

    for (const synonym of [...SYNONYMS].reverse()) {
      await queryRunner.query(`DROP SYNONYM IF EXISTS [dbo].[${synonym}]`);
    }
  }
}
