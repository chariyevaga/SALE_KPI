import type { MigrationInterface, QueryRunner } from 'typeorm';

// Target suggestions for STORE_CONVERSION (ADR-057). The conversion of each store and
// complete month is measured with the calculation's rules (ADR-052, conversion-rules.ts):
// only days with an entered visitor count, their sales receipts over their visitors, and no
// value below 80 % coverage of the month's days. Those months join dbo.kpi_report_summary,
// so the suggestion formula stays in that one view (docs/REPORTS.md "Öneri hesabı").

const MONTH_OFFSETS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

/** Must match MIN_CONVERSION_COVERAGE in kpi-results/conversion-rules.ts. */
const MIN_CONVERSION_COVERAGE = 80;

const CONVERSION_MONTHLY_SQL = `
  CREATE OR ALTER VIEW [dbo].[kpi_report_conversion_monthly]
  AS
  -- STORE_CONVERSION per store (Tiger branch number) and complete month of the 12 before the
  -- current month (ADR-057), by the calculation's rules (ADR-052): only store-days with an
  -- entered visitor count; receipts are that day's sales invoices (TRCODE 7). value is NULL
  -- below ${String(MIN_CONVERSION_COVERAGE)} % coverage of the month's days or without visitors.
  WITH [report_period] AS (
    SELECT DATEADD(MONTH, -12, p.[current_month]) AS [first_month], p.[current_month]
    FROM (SELECT DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AS [current_month]) p
  ),
  [counted] AS (
    SELECT
      CAST(s.[nr] AS int) AS [store_nr],
      v.[visit_date],
      v.[visitor_count],
      DATEFROMPARTS(YEAR(v.[visit_date]), MONTH(v.[visit_date]), 1) AS [month_start]
    FROM [dbo].[store_visitor_counts] v
    JOIN [dbo].[stores] s ON s.[id] = v.[store_id]
    JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
    CROSS JOIN [report_period] p
    WHERE v.[visit_date] >= p.[first_month] AND v.[visit_date] < p.[current_month]
  ),
  [receipts] AS (
    SELECT d.[store_nr], d.[sale_date], COUNT(*) AS [receipts]
    FROM [dbo].[kpi_report_documents] d
    CROSS JOIN [report_period] p
    WHERE d.[trcode] = 7 AND d.[sale_date] >= p.[first_month] AND d.[sale_date] < p.[current_month]
    GROUP BY d.[store_nr], d.[sale_date]
  ),
  [months] AS (
    SELECT
      c.[store_nr],
      c.[month_start],
      COUNT(*) AS [counted_days],
      DAY(EOMONTH(c.[month_start])) AS [possible_days],
      SUM(CAST(c.[visitor_count] AS bigint)) AS [visitors],
      SUM(CAST(ISNULL(r.[receipts], 0) AS bigint)) AS [receipts]
    FROM [counted] c
    LEFT JOIN [receipts] r ON r.[store_nr] = c.[store_nr] AND r.[sale_date] = c.[visit_date]
    GROUP BY c.[store_nr], c.[month_start]
  )
  SELECT
    m.[store_nr],
    m.[month_start],
    DATEDIFF(MONTH, m.[month_start], p.[current_month]) AS [month_offset],
    m.[counted_days],
    m.[possible_days],
    CAST(ROUND(m.[counted_days] * 100.0 / m.[possible_days], 2) AS decimal(5, 2)) AS [coverage],
    m.[visitors],
    m.[receipts],
    CASE
      WHEN ROUND(m.[counted_days] * 100.0 / m.[possible_days], 2) >= ${String(MIN_CONVERSION_COVERAGE)}
        AND m.[visitors] > 0
      THEN CAST(ROUND(m.[receipts] * 100.0 / m.[visitors], 2) AS decimal(19, 4))
    END AS [value]
  FROM [months] m
  CROSS JOIN [report_period] p
`;

/**
 * dbo.kpi_report_summary as migration 1799703500000 built it, reading `source`. The formula
 * is unchanged; only the conversion months are added to what it summarises.
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

const MONTHLY_ONLY = `
      SELECT m.[kpi_code], m.[entity_ref], m.[currency], m.[month_offset], m.[value]
      FROM [dbo].[kpi_report_monthly] m`;

const MONTHLY_WITH_CONVERSION = `${MONTHLY_ONLY}
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

/** Same columns as the other store reports; conversion is a percentage with 2 decimals. */
const REPORT_SQL = `
  CREATE OR ALTER VIEW [dbo].[report_STORE_CONVERSION]
  AS
  SELECT
    CAST(s.[nr] AS int) AS [SUBE_NR],
    CAST(LTRIM(RTRIM(s.[name])) AS nvarchar(61)) AS [SUBE_ADI],
    ${MONTH_OFFSETS.map(
      (offset) =>
        `CAST(r.[value_m${String(offset)}] AS decimal(9, 2)) AS [-${String(offset)}_AY_KONVERSIYON]`,
    ).join(',\n    ')},
    ISNULL(r.[month_count], 0) AS [AY_SAYISI],
    CAST(r.[average_value] AS decimal(9, 2)) AS [ORTALAMA],
    CAST(r.[last3_average] AS decimal(9, 2)) AS [SON_3_AY_ORTALAMA],
    CAST(r.[min_value] AS decimal(9, 2)) AS [EN_DUSUK],
    CAST(r.[max_value] AS decimal(9, 2)) AS [EN_YUKSEK],
    CAST(ROUND(r.[achievable_max_target], 2) AS decimal(9, 2)) AS [ULASILABILIR_MAX_HEDEF],
    CAST(ROUND(r.[recommended_target], 2) AS decimal(9, 2)) AS [ONERILEN_HEDEF]
  FROM [dbo].[stores] s
  JOIN [dbo].[kpi_report_settings] cfg ON cfg.[firm_nr] = s.[firm_nr]
  LEFT JOIN [dbo].[kpi_report_summary] r
    ON r.[kpi_code] = N'STORE_CONVERSION'
    AND r.[entity_ref] = s.[nr]
`;

export class AddConversionReport1799704500000 implements MigrationInterface {
  name = 'AddConversionReport1799704500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(CONVERSION_MONTHLY_SQL);
    await queryRunner.query(summaryViewSql(MONTHLY_WITH_CONVERSION));
    await queryRunner.query(REPORT_SQL);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[report_STORE_CONVERSION]`);
    await queryRunner.query(summaryViewSql(MONTHLY_ONLY));
    await queryRunner.query(`DROP VIEW IF EXISTS [dbo].[kpi_report_conversion_monthly]`);
  }
}
