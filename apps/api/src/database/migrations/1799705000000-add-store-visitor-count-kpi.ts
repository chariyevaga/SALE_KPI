import type { MigrationInterface, QueryRunner } from 'typeorm';

// STORE_VISITOR_COUNT (ADR-064): how many people entered the selected stores in a month — the
// total of the daily counts entered on the visitor counts screen (ADR-043), whether or not
// they bought anything. Days without a count are not guessed. The target is a monthly total
// ("1,000 visitors in October") for one store or several stores together.
//
// - dbo.kpi_visitor_count_monthly is the measure's single implementation: visitors per
//   store (Tiger branch number, like every other store KPI) and month, configured firm only.
// - dbo.kpi_month_visitor_values(@month) gives one month in the shape of
//   dbo.kpi_month_values, so the calculation and the store dashboard read it like the
//   Tiger measures (ADR-041, ADR-061).
// - The target report (dbo.report_STORE_VISITOR_COUNT, ADR-038) adds the 12 months before
//   the current one to dbo.kpi_report_summary; the suggestion formula stays in that view.
// - The definition is #16 (ADR-060): numbers already in use do not move (user decision
//   2026-10-08), so this store KPI is listed after the employee KPIs.

const MONTH_OFFSETS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

const VISITOR_COUNT_MONTHLY_SQL = `
  CREATE VIEW [dbo].[kpi_visitor_count_monthly]
  AS
  -- STORE_VISITOR_COUNT per store (Tiger branch number) and month (ADR-064): the total of
  -- the entered daily visitor counts. A day without a count adds nothing; 0 is a closed day.
  SELECT
    CAST(s.[nr] AS int) AS [store_nr],
    DATEFROMPARTS(YEAR(v.[visit_date]), MONTH(v.[visit_date]), 1) AS [month_start],
    COUNT(*) AS [counted_days],
    SUM(CAST(v.[visitor_count] AS bigint)) AS [visitors]
  FROM [dbo].[store_visitor_counts] v
  JOIN [dbo].[stores] s ON s.[id] = v.[store_id]
  JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
  GROUP BY s.[nr], DATEFROMPARTS(YEAR(v.[visit_date]), MONTH(v.[visit_date]), 1)
`;

const MONTH_VISITOR_VALUES_FUNCTION_SQL = `
  CREATE FUNCTION [dbo].[kpi_month_visitor_values] (@month_start date)
  RETURNS TABLE
  AS
  -- One month of STORE_VISITOR_COUNT in the shape of dbo.kpi_month_values (ADR-064).
  RETURN
  (
    SELECT
      CAST(N'STORE_VISITOR_COUNT' AS nvarchar(64)) AS [kpi_code],
      m.[store_nr] AS [entity_ref],
      CAST(NULL AS nvarchar(3)) AS [currency],
      CAST(m.[visitors] AS decimal(19, 4)) AS [value]
    FROM [dbo].[kpi_visitor_count_monthly] m
    WHERE m.[month_start] = @month_start
  )
`;

/**
 * dbo.kpi_report_summary as migration 1799704500000 built it, reading `source`. The formula
 * is unchanged; only the visitor count months are added to what it summarises.
 */
function summaryViewSql(source: string): string {
  const months = MONTH_OFFSETS.map(
    (offset) =>
      `MAX(CASE WHEN r.[month_offset] = ${String(offset)} THEN r.[value] END) AS [value_m${String(offset)}]`,
  );

  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_summary]
    AS
    -- The 12 months side by side with statistics and target suggestions (docs/REPORTS.md):
    --   base_value            = the higher of the average and the last 3 months' average
    --   achievable_max_target = the higher of the best quarter of the months' average
    --                           (best 3 of 12, best 2 of 6, the best of up to 4) and base_value
    --   recommended_target    = halfway between base_value and achievable_max_target
    WITH [monthly] AS (
      ${source}
    ),
    [ranked] AS (
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
      FROM [monthly] m
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
      ${MONTH_OFFSETS.map((offset) => `t.[value_m${String(offset)}]`).join(',\n      ')},
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

/** The summary's source as migration 1799704500000 left it. */
const MONTHLY_WITH_CONVERSION = `
      SELECT m.[kpi_code], m.[entity_ref], m.[currency], m.[month_offset], m.[value]
      FROM [dbo].[kpi_report_monthly] m
      UNION ALL
      -- Months below the coverage rule have no value and do not count (ADR-057).
      SELECT
        CAST(N'STORE_CONVERSION' AS nvarchar(64)),
        c.[store_nr],
        CAST(NULL AS nvarchar(3)),
        c.[month_offset],
        c.[value]
      FROM [dbo].[kpi_report_conversion_monthly] c
      WHERE c.[value] IS NOT NULL`;

const MONTHLY_WITH_VISITOR_COUNT = `${MONTHLY_WITH_CONVERSION}
      UNION ALL
      -- Entered visitors of the 12 months before the current one; a month without any
      -- count has no row and does not count, like a month without documents (ADR-064).
      SELECT
        CAST(N'STORE_VISITOR_COUNT' AS nvarchar(64)),
        v.[store_nr],
        CAST(NULL AS nvarchar(3)),
        DATEDIFF(MONTH, v.[month_start], p.[current_month]),
        CAST(v.[visitors] AS decimal(19, 4))
      FROM [dbo].[kpi_visitor_count_monthly] v
      CROSS JOIN (
        SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]
      ) p
      WHERE v.[month_start] >= DATEADD(MONTH, -12, p.[current_month])
        AND v.[month_start] < p.[current_month]`;

/** Same columns as the other store count reports (migration 1799703500000). */
const REPORT_SQL = `
  CREATE OR ALTER VIEW [dbo].[report_STORE_VISITOR_COUNT]
  AS
  SELECT
    CAST(s.[nr] AS int) AS [SUBE_NR],
    CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
    ${MONTH_OFFSETS.map(
      (offset) => `CAST(r.[value_m${String(offset)}] AS int) AS [-${String(offset)}_AY_ZIYARETCI]`,
    ).join(',\n    ')},
    ISNULL(r.[month_count], 0) AS [AY_SAYISI],
    CAST(r.[average_value] AS decimal(19, 2)) AS [ORTALAMA],
    CAST(r.[last3_average] AS decimal(19, 2)) AS [SON_3_AY_ORTALAMA],
    CAST(r.[min_value] AS int) AS [EN_DUSUK],
    CAST(r.[max_value] AS int) AS [EN_YUKSEK],
    CAST(ROUND(r.[achievable_max_target], 0) AS int) AS [ULASILABILIR_MAX_HEDEF],
    CAST(ROUND(r.[recommended_target], 0) AS int) AS [ONERILEN_HEDEF]
  FROM [dbo].[stores] s
  JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
  LEFT JOIN [dbo].[kpi_report_summary] r
    ON r.[kpi_code] = N'STORE_VISITOR_COUNT'
    AND r.[entity_ref] = s.[nr]
`;

/** Inlined like every seed: a migration is a snapshot (ADR-032). */
const DEFINITION = {
  code: 'STORE_VISITOR_COUNT',
  scope: 'store',
  unit: 'count',
  inputMode: 'calculated',
  sortOrder: 160,
  name: {
    tr: '#16 Mağaza bazında ziyaretçi sayısı',
    en: '#16 Visitor count by store',
    ru: '#16 Количество посетителей по магазину',
    tk: '#16 Dükan boýunça gelýänleriň sany',
  },
  inputSchema: [
    {
      key: 'storeIds',
      type: 'lookup',
      label: { tr: 'Mağazalar', en: 'Stores', ru: 'Магазины', tk: 'Dükanlar' },
      required: true,
      multiple: true,
      source: 'stores',
    },
  ],
} as const;

export class AddStoreVisitorCountKpi1799705000000 implements MigrationInterface {
  name = 'AddStoreVisitorCountKpi1799705000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(VISITOR_COUNT_MONTHLY_SQL);
    await queryRunner.query(MONTH_VISITOR_VALUES_FUNCTION_SQL);
    await queryRunner.query(summaryViewSql(MONTHLY_WITH_VISITOR_COUNT));
    await queryRunner.query(REPORT_SQL);
    // A system write: created_by stays NULL and nothing goes to audit_logs (ADR-036).
    await queryRunner.query(
      `
        INSERT INTO [dbo].[kpi_definitions] (
          [code], [scope], [unit], [input_mode], [name], [input_schema], [sort_order]
        )
        VALUES (@0, @1, @2, @3, @4, @5, @6)
      `,
      [
        DEFINITION.code,
        DEFINITION.scope,
        DEFINITION.unit,
        DEFINITION.inputMode,
        JSON.stringify(DEFINITION.name),
        JSON.stringify(DEFINITION.inputSchema),
        DEFINITION.sortOrder,
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Fails on the foreign key while a template or plan still uses the KPI.
    await queryRunner.query(`DELETE FROM [dbo].[kpi_definitions] WHERE [code] = @0`, [
      DEFINITION.code,
    ]);
    await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[report_STORE_VISITOR_COUNT]`);
    await queryRunner.query(summaryViewSql(MONTHLY_WITH_CONVERSION));
    await queryRunner.query(`DROP FUNCTION IF EXISTS [dbo].[kpi_month_visitor_values]`);
    await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[kpi_visitor_count_monthly]`);
  }
}
