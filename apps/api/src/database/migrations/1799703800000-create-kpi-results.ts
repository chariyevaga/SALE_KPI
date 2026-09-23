import type { MigrationInterface, QueryRunner } from 'typeorm';

// KPI results (ADR-041): what a plan row actually achieved, the score it earned and the
// total of the plan. Record trail columns are part of the table from the start (ADR-036).
//
// The measures themselves are not written again here. `dbo.kpi_report_documents`
// (1799703500000, ADR-038) already applies the Tiger rules of docs/TIGER_DATA.md; this
// migration only adds an inline function that reads that view for one month.

/** Kept in step with the report views; migrations stay self-contained, so these repeat. */
const MEASURES = [
  { measure: 'SALES', currency: "N'TMT'", column: 'sales_tmt' },
  { measure: 'SALES', currency: "N'USD'", column: 'sales_usd' },
  { measure: 'RECEIPTS', currency: 'NULL', column: 'receipts' },
  { measure: 'CUSTOMERS', currency: 'NULL', column: 'customers' },
  { measure: 'NEW_CUSTOMERS', currency: 'NULL', column: 'new_customers' },
  { measure: 'RETURNING_CUSTOMERS', currency: 'NULL', column: 'returning_customers' },
  { measure: 'PRODUCT_VARIETY', currency: 'NULL', column: 'product_variety' },
] as const;

const SCOPES = {
  store: { prefix: 'STORE', entity: 'd.[store_nr]', conditions: [] as string[] },
  employee: {
    prefix: 'EMPLOYEE',
    entity: 'd.[salesman_ref]',
    // Sales without a salesperson count for stores only (docs/BUSINESS_RULES.md).
    conditions: ['d.[salesman_ref] IS NOT NULL'],
  },
} as const;

type Scope = keyof typeof SCOPES;

function auditColumns(table: string): string {
  return `
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_${table}_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_${table}_updated_at] DEFAULT SYSUTCDATETIME(),
        [updated_by] uniqueidentifier NULL`;
}

function auditForeignKeys(table: string): string {
  return `
        CONSTRAINT [FK_${table}_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_${table}_updated_by]
          FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id])`;
}

function where(conditions: readonly string[]): string {
  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

function scopeSql(scope: Scope): string {
  const { entity, conditions } = SCOPES[scope];

  return `
    [${scope}_documents] AS (
      SELECT
        ${entity} AS [entity_ref],
        SUM(d.[sales_tmt]) AS [sales_tmt],
        SUM(d.[sales_usd]) AS [sales_usd],
        SUM(d.[receipts]) AS [receipts],
        COUNT(DISTINCT d.[customer_ref]) AS [customers],
        COUNT(DISTINCT CASE WHEN d.[is_first_purchase] = 1 THEN d.[customer_ref] END) AS [new_customers],
        COUNT(DISTINCT CASE WHEN d.[is_returning_visit] = 1 THEN d.[customer_ref] END) AS [returning_customers]
      FROM [documents] d
      ${where(conditions)}
      GROUP BY ${entity}
    ),
    [${scope}_variety] AS (
      SELECT ${entity} AS [entity_ref], COUNT(DISTINCT l.[STOCKREF]) AS [product_variety]
      FROM [documents] d
      JOIN [dbo].[tiger_stline] l ON l.[INVOICEREF] = d.[invoice_ref]
      ${where([...conditions, 'd.[trcode] = 7', 'l.[LINETYPE] = 0'])}
      GROUP BY ${entity}
    ),
    [${scope}_values] AS (
      SELECT
        a.[entity_ref],
        a.[sales_tmt],
        a.[sales_usd],
        a.[receipts],
        a.[customers],
        a.[new_customers],
        a.[returning_customers],
        ISNULL(v.[product_variety], 0) AS [product_variety]
      FROM [${scope}_documents] a
      LEFT JOIN [${scope}_variety] v ON v.[entity_ref] = a.[entity_ref]
    )`;
}

function monthValuesFunctionSql(): string {
  const branches = (Object.keys(SCOPES) as Scope[]).flatMap((scope) =>
    MEASURES.map(
      ({ measure, currency, column }) => `
      SELECT
        CAST(N'${SCOPES[scope].prefix}_${measure}' AS nvarchar(64)) AS [kpi_code],
        CAST(m.[entity_ref] AS int) AS [entity_ref],
        CAST(${currency} AS nvarchar(3)) AS [currency],
        CAST(m.[${column}] AS decimal(19, 4)) AS [value]
      FROM [${scope}_values] m`,
    ),
  );

  return `
    CREATE FUNCTION [dbo].[kpi_month_values] (@month_start date)
    RETURNS TABLE
    AS
    -- What every store and salesperson did in one month, in the same shape as
    -- dbo.kpi_report_monthly. The measures come from dbo.kpi_report_documents, so the
    -- rules of docs/TIGER_DATA.md have a single implementation (ADR-041).
    RETURN
    (
      WITH [documents] AS (
        SELECT
          d.[invoice_ref],
          d.[trcode],
          d.[store_nr],
          d.[salesman_ref],
          d.[customer_ref],
          d.[receipts],
          d.[sales_tmt],
          d.[sales_usd],
          d.[is_first_purchase],
          d.[is_returning_visit]
        FROM [dbo].[kpi_report_documents] d
        WHERE d.[month_start] = @month_start
      ),
      ${scopeSql('store')},
      ${scopeSql('employee')}
      ${branches.join('\n      UNION ALL')}
    )
  `;
}

export class CreateKpiResults1799703800000 implements MigrationInterface {
  name = 'CreateKpiResults1799703800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(monthValuesFunctionSql());

    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_results] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_results_id] DEFAULT NEWSEQUENTIALID(),
        [assignment_id] uniqueidentifier NOT NULL,
        [assignment_item_id] uniqueidentifier NOT NULL,
        [kpi_definition_id] uniqueidentifier NOT NULL,
        [target_value] decimal(19, 4) NULL,
        [actual_value] decimal(19, 4) NULL,
        [source] nvarchar(16) NOT NULL,
        [raw_achievement] decimal(9, 2) NULL,
        [capped_achievement] decimal(6, 2) NULL,
        [weight] decimal(5, 2) NOT NULL,
        [weighted_score] decimal(6, 2) NULL,
        [calculated_at] datetime2(3) NULL,${auditColumns('kpi_results')},
        CONSTRAINT [PK_kpi_results] PRIMARY KEY ([id]),${auditForeignKeys('kpi_results')},
        CONSTRAINT [FK_kpi_results_assignment]
          FOREIGN KEY ([assignment_id]) REFERENCES [dbo].[kpi_assignments] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_kpi_results_item]
          FOREIGN KEY ([assignment_item_id]) REFERENCES [dbo].[kpi_assignment_items] ([id]),
        CONSTRAINT [FK_kpi_results_definition]
          FOREIGN KEY ([kpi_definition_id]) REFERENCES [dbo].[kpi_definitions] ([id]),
        CONSTRAINT [CK_kpi_results_source] CHECK ([source] IN (N'calculated', N'manual')),
        CONSTRAINT [CK_kpi_results_weight_range] CHECK ([weight] > 0 AND [weight] <= 100),
        CONSTRAINT [CK_kpi_results_capped_range] CHECK (
          [capped_achievement] IS NULL
          OR ([capped_achievement] >= 0 AND [capped_achievement] <= 100)
        ),
        CONSTRAINT [CK_kpi_results_weighted_range] CHECK (
          [weighted_score] IS NULL OR ([weighted_score] >= 0 AND [weighted_score] <= 100)
        )
      )
    `);

    // One result per plan row; recalculating replaces the row instead of adding one.
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_kpi_results_item]
      ON [dbo].[kpi_results] ([assignment_item_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_results_assignment]
      ON [dbo].[kpi_results] ([assignment_id])
    `);

    // The plan carries its own total so lists and "My KPI" read it without aggregating.
    await queryRunner.query(`
      ALTER TABLE [dbo].[kpi_assignments] ADD
        [total_score] decimal(6, 2) NULL,
        [scored_item_count] int NULL,
        [score_calculated_at] datetime2(3) NULL,
        CONSTRAINT [CK_kpi_assignments_total_score_range] CHECK (
          [total_score] IS NULL OR ([total_score] >= 0 AND [total_score] <= 100)
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[kpi_assignments] DROP CONSTRAINT [CK_kpi_assignments_total_score_range]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[kpi_assignments]
      DROP COLUMN [total_score], [scored_item_count], [score_calculated_at]
    `);
    await queryRunner.query(`DROP TABLE [dbo].[kpi_results]`);
    await queryRunner.query(`DROP FUNCTION [dbo].[kpi_month_values]`);
  }
}
