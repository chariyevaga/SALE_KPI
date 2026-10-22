/*
  KPI mail send: n8n "KPI_DB" (Microsoft SQL) düğümünün sorgusu (ADR-063, docs/N8N.md).

  Yalnız okur. Tek satır, tek sütun döner: [payload] = dönemin bütün planları JSON olarak.
  Puanlar hesaplanmaz; zamanlanmış hesaplamanın kpi_assignments / kpi_results'a yazdığı
  değerler okunur (ADR-041, ADR-047). Maaş tutarlarını Code düğümü hesaplar (build-mails.js).

  FOR JSON bir alt sorguda olduğu için sonuç bölünmeden tek nvarchar(max) değer olarak gelir.
  Dönemde plan yoksa [payload] NULL olur ve hiç mail gönderilmez.
*/
SET NOCOUNT ON;

-- Hangi ay: NULL = sıralama tablosuyla aynı seçim (içinde bulunulan ay, onun planı yoksa
-- planı olan en yeni ay). Belirli bir ayı denemek için ör. '2026-09-01' yazın.
DECLARE @month date = NULL;

-- Bugün, iş saat diliminde (Aşkabat, UTC+5; dbo.erp_employees ile aynı ad).
DECLARE @today date = CAST(SYSUTCDATETIME() AT TIME ZONE 'UTC' AT TIME ZONE 'West Asia Standard Time' AS date);

-- dbo.stores bütün firmaları döndürür; rapor view'larının kurulduğu firma (FIRM_NR) kullanılır.
DECLARE @firm_nr int = (SELECT TOP (1) [firm_nr] FROM [dbo].[kpi_report_settings]);

DECLARE @period_id uniqueidentifier;
DECLARE @month_start date;

SELECT TOP (1)
  @period_id = p.[id],
  @month_start = DATEFROMPARTS(p.[year], p.[month], 1)
FROM [dbo].[kpi_periods] p
WHERE EXISTS (SELECT 1 FROM [dbo].[kpi_assignments] a WHERE a.[period_id] = p.[id])
  AND (@month IS NULL OR (p.[year] = YEAR(@month) AND p.[month] = MONTH(@month)))
ORDER BY
  CASE WHEN p.[year] = YEAR(@today) AND p.[month] = MONTH(@today) THEN 0 ELSE 1 END,
  p.[year] DESC,
  p.[month] DESC;

SELECT (
  SELECT
    p.[id] AS [period.id],
    p.[year] AS [period.year],
    p.[month] AS [period.month],
    p.[status] AS [period.status],
    p.[closed_at] AT TIME ZONE 'UTC' AS [period.closedAt],
    SYSUTCDATETIME() AT TIME ZONE 'UTC' AS [generatedAt],
    JSON_QUERY((
      SELECT
        a.[id] AS [id],
        a.[template_name] AS [templateName],
        a.[total_score] AS [totalScore],
        a.[scored_item_count] AS [scoredItemCount],
        a.[score_calculated_at] AT TIME ZONE 'UTC' AS [scoreCalculatedAt],
        e.[id] AS [employee.id],
        e.[firstname] AS [employee.firstname],
        e.[lastname] AS [employee.lastname],
        e.[email] AS [employee.email],
        e.[is_active] AS [employee.isActive],
        e.[job_title] AS [employee.jobTitle],
        CAST(st.[name] AS nvarchar(255)) AS [employee.storeName],
        -- Ayın maaşı: geçerli olduğu ay dönemin ayından sonra olmayan en yeni maaş (ADR-048).
        JSON_QUERY((
          SELECT TOP (1)
            CONVERT(char(7), s.[effective_month], 126) AS [effectiveMonth],
            s.[amount] AS [amount],
            s.[currency] AS [currency],
            s.[fixed_percent] AS [fixedPercent],
            s.[kpi_percent] AS [kpiPercent]
          FROM [dbo].[employee_salaries] s
          WHERE s.[employee_id] = e.[id]
            AND s.[effective_month] <= @month_start
          ORDER BY s.[effective_month] DESC
          FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        )) AS [salary],
        JSON_QUERY((
          SELECT
            i.[sort_order] AS [sortOrder],
            d.[code] AS [code],
            d.[scope] AS [scope],
            d.[unit] AS [unit],
            JSON_QUERY(d.[name]) AS [name],
            JSON_QUERY(i.[input_values]) AS [inputs],
            JSON_QUERY((
              SELECT s.[nr] AS [nr], CAST(s.[name] AS nvarchar(255)) AS [name]
              FROM OPENJSON(i.[input_values], '$.storeIds') j
              JOIN [dbo].[stores] s
                ON s.[id] = TRY_CAST(j.[value] AS int)
               AND s.[firm_nr] = @firm_nr
              ORDER BY s.[nr]
              FOR JSON PATH
            )) AS [stores],
            -- Hedef ve ağırlık hesaplama anında dondurulur; hesaplanmamış satırda planınki.
            COALESCE(r.[weight], i.[weight]) AS [weight],
            COALESCE(r.[target_value], i.[target_value]) AS [target],
            r.[actual_value] AS [actual],
            r.[source] AS [source],
            r.[raw_achievement] AS [rawAchievement],
            r.[capped_achievement] AS [cappedAchievement],
            r.[weighted_score] AS [weightedScore],
            r.[calculated_at] AT TIME ZONE 'UTC' AS [calculatedAt],
            JSON_QUERY(r.[detail]) AS [detail]
          FROM [dbo].[kpi_assignment_items] i
          JOIN [dbo].[kpi_definitions] d ON d.[id] = i.[kpi_definition_id]
          LEFT JOIN [dbo].[kpi_results] r ON r.[assignment_item_id] = i.[id]
          WHERE i.[assignment_id] = a.[id]
          ORDER BY i.[sort_order]
          FOR JSON PATH, INCLUDE_NULL_VALUES
        )) AS [items]
      FROM [dbo].[kpi_assignments] a
      JOIN [dbo].[employees] e ON e.[id] = a.[employee_id]
      LEFT JOIN [dbo].[stores] st
        ON st.[id] = e.[default_store_id]
       AND st.[firm_nr] = @firm_nr
      WHERE a.[period_id] = @period_id
      ORDER BY e.[firstname], e.[lastname]
      FOR JSON PATH, INCLUDE_NULL_VALUES
    )) AS [plans]
  FROM [dbo].[kpi_periods] p
  WHERE p.[id] = @period_id
  FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
) AS [payload];
