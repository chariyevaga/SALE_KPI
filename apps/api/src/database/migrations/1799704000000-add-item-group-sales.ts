import type { MigrationInterface, QueryRunner } from 'typeorm';

import { getKpiDatabaseConfig, getTigerDatabaseConfig } from '../../config/environment.js';
import { TigerTables } from '../../tiger/tiger-tables.js';

// Item group sales (ADR-045): STORE_GROUP_SALES and EMPLOYEE_GROUP_SALES. The group of a sale
// is the Tiger item card's STGRPCODE; the invoice revenue of the report views (ADR-038) is
// spread over the invoice's material lines by LINENET, so the group figures add up to the
// sales figures to the cent. The report objects of 1799703500000 are left untouched; the
// group objects sit next to them. SQL is inlined: a migration is a snapshot.

function quoteIdentifier(value: string): string {
  if (!value || value.length > 128) {
    throw new Error('TIGER_DB_NAME must contain between 1 and 128 characters.');
  }

  return `[${value.replaceAll(']', ']]')}]`;
}

/** Month columns, oldest first: 12 = twelve months before the current month, 1 = last month. */
const MONTH_OFFSETS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

const GROUP_REPORTS = [
  { code: 'STORE_GROUP_SALES', scope: 'store' },
  { code: 'EMPLOYEE_GROUP_SALES', scope: 'employee' },
] as const;

type GroupReport = (typeof GROUP_REPORTS)[number];

const VIEWS = [
  'item_groups',
  'kpi_report_group_lines',
  'kpi_report_group_monthly',
  'kpi_report_group_summary',
  'item_group_coverage',
] as const;

// Seed data follows 1799703200000: the same inputs, plus the item groups.
const STORE_IDS_INPUT = {
  key: 'storeIds',
  type: 'lookup',
  label: { tr: 'Mağazalar', en: 'Stores', ru: 'Магазины', tk: 'Dükanlar' },
  required: true,
  multiple: true,
  source: 'stores',
};

const GROUP_CODES_INPUT = {
  key: 'groupCodes',
  type: 'lookup',
  label: {
    tr: 'Malzeme grupları',
    en: 'Item groups',
    ru: 'Группы товаров',
    tk: 'Haryt toparlary',
  },
  required: true,
  multiple: true,
  source: 'itemGroups',
};

const CURRENCY_INPUT = {
  key: 'currency',
  type: 'select',
  label: { tr: 'Para birimi', en: 'Currency', ru: 'Валюта', tk: 'Walýuta' },
  required: true,
  multiple: false,
  options: [
    {
      value: 'TMT',
      label: {
        tr: 'Türkmen manatı (TMT)',
        en: 'Turkmen manat (TMT)',
        ru: 'Туркменский манат (TMT)',
        tk: 'Türkmen manady (TMT)',
      },
    },
    {
      value: 'USD',
      label: {
        tr: 'ABD doları (USD)',
        en: 'US dollar (USD)',
        ru: 'Доллар США (USD)',
        tk: 'ABŞ dollary (USD)',
      },
    },
  ],
};

const DEFINITIONS = [
  {
    code: 'STORE_GROUP_SALES',
    scope: 'store',
    unit: 'money',
    inputMode: 'calculated',
    sortOrder: 150,
    name: {
      tr: 'Mağaza bazında malzeme grubu cirosu',
      en: 'Item group sales by store',
      ru: 'Выручка по группам товаров в магазине',
      tk: 'Dükan boýunça haryt topary satuwy',
    },
    inputSchema: [STORE_IDS_INPUT, GROUP_CODES_INPUT, CURRENCY_INPUT],
  },
  {
    code: 'EMPLOYEE_GROUP_SALES',
    scope: 'employee',
    unit: 'money',
    inputMode: 'calculated',
    sortOrder: 160,
    name: {
      tr: 'Personel bazında malzeme grubu cirosu',
      en: 'Item group sales by employee',
      ru: 'Выручка по группам товаров сотрудника',
      tk: 'Işgär boýunça haryt topary satuwy',
    },
    inputSchema: [GROUP_CODES_INPUT, CURRENCY_INPUT],
  },
] as const;

/** Trimmed, upper-case group code; Tiger compares codes case-insensitively as well. */
const GROUP_CODE_SQL =
  "NULLIF(UPPER(LTRIM(RTRIM(CAST(it.[STGRPCODE] AS nvarchar(25))))), N'') COLLATE DATABASE_DEFAULT";

const ITEM_GROUPS_VIEW_SQL = `
  CREATE OR ALTER VIEW [dbo].[item_groups]
  AS
  -- Item groups for the KPI target form: the non-empty STGRPCODE values of the configured
  -- firm's item cards. Logo has no master table for them (ADR-045).
  SELECT g.[code], COUNT(*) AS [item_count]
  FROM (
    SELECT ${GROUP_CODE_SQL} AS [code]
    FROM [dbo].[tiger_items] it
  ) g
  WHERE g.[code] IS NOT NULL
  GROUP BY g.[code]
`;

const GROUP_LINES_VIEW_SQL = `
  CREATE OR ALTER VIEW [dbo].[kpi_report_group_lines]
  AS
  -- Sales (TRCODE 7) and returns (TRCODE 2) per material line. The invoice's revenue, as
  -- dbo.kpi_report_documents measures it (TMT: NETTOTAL - TOTALVAT, USD: REPORTNET), is
  -- spread over its material lines by LINENET, so the lines of an invoice add up to the
  -- invoice to the cent in both currencies (docs/TIGER_DATA.md, ADR-045). Amounts stay
  -- float until they are summed; group_code is NULL for items without a group.
  WITH [lines] AS (
    SELECT
      i.[LOGICALREF] AS [invoice_ref],
      CAST(i.[DATE_] AS date) AS [sale_date],
      DATEFROMPARTS(YEAR(i.[DATE_]), MONTH(i.[DATE_]), 1) AS [month_start],
      i.[BRANCH] AS [store_nr],
      NULLIF(i.[SALESMANREF], 0) AS [salesman_ref],
      ${GROUP_CODE_SQL} AS [group_code],
      CASE i.[TRCODE] WHEN 7 THEN 1 ELSE -1 END AS [sign],
      i.[NETTOTAL] - i.[TOTALVAT] AS [invoice_tmt],
      i.[REPORTNET] AS [invoice_usd],
      l.[LINENET] AS [line_net],
      SUM(l.[LINENET]) OVER (PARTITION BY i.[LOGICALREF]) AS [invoice_line_net]
    FROM [dbo].[tiger_invoice] i
    JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = i.[LOGICALREF] AND l.[LINETYPE] = 0
    LEFT JOIN [dbo].[tiger_items] it ON it.[LOGICALREF] = l.[STOCKREF]
    WHERE i.[CANCELLED] = 0 AND i.[TRCODE] IN (2, 7)
  )
  SELECT
    [invoice_ref],
    [sale_date],
    [month_start],
    [store_nr],
    [salesman_ref],
    [group_code],
    [sign] * [invoice_tmt] * [line_net] / NULLIF([invoice_line_net], 0) AS [sales_tmt],
    [sign] * [invoice_usd] * [line_net] / NULLIF([invoice_line_net], 0) AS [sales_usd]
  FROM [lines]
`;

/** Store and salesperson branches, TMT and USD, of a grouped SELECT over `[lines] l`. */
function valueBranches(groupBy: string): string {
  const scopes = [
    { code: 'STORE_GROUP_SALES', entity: 'l.[store_nr]', where: '' },
    {
      code: 'EMPLOYEE_GROUP_SALES',
      entity: 'l.[salesman_ref]',
      // Sales without a salesperson count for stores only (docs/BUSINESS_RULES.md).
      where: 'WHERE l.[salesman_ref] IS NOT NULL',
    },
  ];
  const currencies = [
    { currency: 'TMT', column: 'sales_tmt' },
    { currency: 'USD', column: 'sales_usd' },
  ];

  return scopes
    .flatMap(({ code, entity, where }) =>
      currencies.map(
        ({ currency, column }) => `
      SELECT
        CAST(N'${code}' AS nvarchar(64)) AS [kpi_code],
        CAST(${entity} AS int) AS [entity_ref],
        l.[group_code],
        CAST(N'${currency}' AS nvarchar(3)) AS [currency],${
          groupBy
            ? `\n        ${groupBy
                .split(', ')
                .map((column) => `l.${column}`)
                .join(',\n        ')},`
            : ''
        }
        CAST(SUM(l.[${column}]) AS decimal(19, 4)) AS [value]
      FROM [lines] l
      ${where}
      GROUP BY ${entity}, l.[group_code]${
        groupBy
          ? `, ${groupBy
              .split(', ')
              .map((column) => `l.${column}`)
              .join(', ')}`
          : ''
      }`,
      ),
    )
    .join('\n      UNION ALL');
}

const GROUP_MONTHLY_VIEW_SQL = `
  CREATE OR ALTER VIEW [dbo].[kpi_report_group_monthly]
  AS
  -- Group sales per KPI, store or salesperson, group, currency and month of the 12 complete
  -- months before the current month, like dbo.kpi_report_monthly. Lines without a group
  -- count in no group KPI (ADR-045).
  WITH [report_period] AS (
    SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
    FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
  ),
  [lines] AS (
    SELECT
      g.[store_nr],
      g.[salesman_ref],
      g.[group_code],
      g.[month_start],
      DATEDIFF(MONTH, g.[month_start], p.[current_month]) AS [month_offset],
      g.[sales_tmt],
      g.[sales_usd]
    FROM [dbo].[kpi_report_group_lines] g
    CROSS JOIN [report_period] p
    WHERE g.[sale_date] >= p.[first_month]
      AND g.[sale_date] < p.[current_month]
      AND g.[group_code] IS NOT NULL
  )
  ${valueBranches('[month_offset], [month_start]')}
`;

function groupSummaryViewSql(): string {
  const months = MONTH_OFFSETS.map(
    (offset) =>
      `MAX(CASE WHEN r.[month_offset] = ${offset} THEN r.[value] END) AS [value_m${offset}]`,
  );
  const keys = 'm.[kpi_code], m.[entity_ref], m.[group_code], m.[currency]';

  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_group_summary]
    AS
    -- dbo.kpi_report_summary with the group as one more key: the same statistics and the
    -- same target suggestion formula (docs/REPORTS.md).
    WITH [ranked] AS (
      SELECT
        m.[kpi_code],
        m.[entity_ref],
        m.[group_code],
        m.[currency],
        m.[month_offset],
        m.[value],
        ROW_NUMBER() OVER (PARTITION BY ${keys} ORDER BY m.[value] DESC) AS [value_rank],
        COUNT(*) OVER (PARTITION BY ${keys}) AS [month_count]
      FROM [dbo].[kpi_report_group_monthly] m
    ),
    [totals] AS (
      SELECT
        r.[kpi_code],
        r.[entity_ref],
        r.[group_code],
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
      GROUP BY r.[kpi_code], r.[entity_ref], r.[group_code], r.[currency]
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
      t.[group_code],
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

function groupReportViewSql(report: GroupReport): string {
  const entity =
    report.scope === 'store'
      ? {
          columns: [
            'CAST(s.[nr] AS int) AS [SUBE_NR]',
            'CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI]',
          ],
          join: '[dbo].[stores] s ON s.[nr] = r.[entity_ref]',
        }
      : {
          columns: [
            'CAST(LTRIM(RTRIM(s.[code])) AS nvarchar(25)) AS [SATIS_ELEMANI_KODU]',
            'CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(51)) AS [SATIS_ELEMANI_ADI]',
            's.[is_active] AS [AKTIF]',
          ],
          join: '[dbo].[erp_employees] s ON s.[id] = r.[entity_ref]',
        };
  const columns = [
    ...entity.columns,
    'r.[group_code] AS [MALZEME_GRUBU]',
    'r.[currency] AS [PARA_BIRIMI]',
    ...MONTH_OFFSETS.map(
      (offset) => `CAST(r.[value_m${offset}] AS decimal(19, 2)) AS [-${offset}_AY_CIRO]`,
    ),
    'r.[month_count] AS [AY_SAYISI]',
    'CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA]',
    'CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA]',
    'CAST(r.[min_value] AS decimal(19, 2)) AS [EN_DUSUK]',
    'CAST(r.[max_value] AS decimal(19, 2)) AS [EN_YUKSEK]',
    'CAST(ROUND(r.[achievable_max_target], 0) AS decimal(19, 0)) AS [ULASILABILIR_MAX_HEDEF]',
    'CAST(ROUND(r.[recommended_target], 0) AS decimal(19, 0)) AS [ONERILEN_HEDEF]',
  ];

  return `
    CREATE OR ALTER VIEW [dbo].[report_${report.code}]
    AS
    -- One row per ${report.scope === 'store' ? 'store' : 'salesperson'}, item group and currency that sold in the last 12 months;
    -- 50 groups times every salesperson would otherwise be mostly empty rows (ADR-045).
    SELECT
      ${columns.join(',\n      ')}
    FROM [dbo].[kpi_report_group_summary] r
    JOIN ${entity.join}
    JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
    WHERE r.[kpi_code] = N'${report.code}'
  `;
}

const COVERAGE_VIEW_SQL = `
  CREATE OR ALTER VIEW [dbo].[item_group_coverage]
  AS
  -- The share of the last 12 complete months' net sales on items without a group code.
  -- Those sales count in no *_GROUP_SALES KPI; schema-check and the target form warn.
  WITH [report_period] AS (
    SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
    FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
  ),
  [totals] AS (
    SELECT
      SUM(l.[sales_tmt]) AS [total_tmt],
      SUM(CASE WHEN l.[group_code] IS NULL THEN l.[sales_tmt] ELSE 0 END) AS [ungrouped_tmt]
    FROM [dbo].[kpi_report_group_lines] l
    CROSS JOIN [report_period] p
    WHERE l.[sale_date] >= p.[first_month] AND l.[sale_date] < p.[current_month]
  )
  SELECT
    CAST(t.[total_tmt] AS decimal(19, 2)) AS [total_tmt],
    CAST(t.[ungrouped_tmt] AS decimal(19, 2)) AS [ungrouped_tmt],
    CAST(100.0 * t.[ungrouped_tmt] / NULLIF(t.[total_tmt], 0) AS decimal(5, 2)) AS [ungrouped_share]
  FROM [totals] t
`;

const MONTH_GROUP_VALUES_FUNCTION_SQL = `
  CREATE FUNCTION [dbo].[kpi_month_group_values] (@month_start date)
  RETURNS TABLE
  AS
  -- What every store and salesperson sold per item group in one month, in the shape of
  -- dbo.kpi_month_values plus group_code. KPI results read it (ADR-041, ADR-045).
  RETURN
  (
    WITH [lines] AS (
      SELECT g.[store_nr], g.[salesman_ref], g.[group_code], g.[sales_tmt], g.[sales_usd]
      FROM [dbo].[kpi_report_group_lines] g
      WHERE g.[month_start] = @month_start AND g.[group_code] IS NOT NULL
    )
    ${valueBranches('')}
  )
`;

export class AddItemGroupSales1799704000000 implements MigrationInterface {
  name = 'AddItemGroupSales1799704000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const kpi = getKpiDatabaseConfig();
    const tiger = getTigerDatabaseConfig();

    if (kpi.host.toLowerCase() !== tiger.host.toLowerCase() || kpi.port !== tiger.port) {
      throw new Error(
        'KPI_DB and TIGERDB must use the same SQL Server host and port for the report views.',
      );
    }

    // The item cards of the configured firm, next to the report synonyms (ADR-037/038).
    const tables = TigerTables.fromEnvironment();

    await queryRunner.query('DROP SYNONYM IF EXISTS [dbo].[tiger_items]');
    await queryRunner.query(
      `CREATE SYNONYM [dbo].[tiger_items] FOR ${quoteIdentifier(tiger.database)}.[dbo].${tables.firmTable('ITEMS')}`,
    );

    await queryRunner.query(ITEM_GROUPS_VIEW_SQL);
    await queryRunner.query(GROUP_LINES_VIEW_SQL);
    await queryRunner.query(GROUP_MONTHLY_VIEW_SQL);
    await queryRunner.query(groupSummaryViewSql());
    await queryRunner.query(COVERAGE_VIEW_SQL);

    for (const report of GROUP_REPORTS) {
      await queryRunner.query(groupReportViewSql(report));
    }

    await queryRunner.query(MONTH_GROUP_VALUES_FUNCTION_SQL);

    for (const definition of DEFINITIONS) {
      await queryRunner.query(
        `
          INSERT INTO [dbo].[kpi_definitions] (
            [code], [scope], [unit], [input_mode], [name], [input_schema], [sort_order]
          )
          VALUES (@0, @1, @2, @3, @4, @5, @6)
        `,
        [
          definition.code,
          definition.scope,
          definition.unit,
          definition.inputMode,
          JSON.stringify(definition.name),
          JSON.stringify(definition.inputSchema),
          definition.sortOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fails on the foreign key while a template still uses one of the two KPIs.
    await queryRunner.query(
      `DELETE FROM [dbo].[kpi_definitions] WHERE [code] IN (N'STORE_GROUP_SALES', N'EMPLOYEE_GROUP_SALES')`,
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS [dbo].[kpi_month_group_values]');

    for (const report of [...GROUP_REPORTS].reverse()) {
      await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[report_${report.code}]`);
    }

    for (const view of [...VIEWS].reverse()) {
      await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[${view}]`);
    }

    await queryRunner.query('DROP SYNONYM IF EXISTS [dbo].[tiger_items]');
  }
}
