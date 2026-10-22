import type { MigrationInterface, QueryRunner } from 'typeorm';

// The store dashboard shows the conversion (#7) too (ADR-065). A rate cannot be added up
// over stores or months; its parts can: all stores = Σ receipts / Σ visitors, a period =
// the same over its months (docs/BUSINESS_RULES.md "Dönüşüm"). numerator and denominator
// keep those parts next to the value; both are NULL for every KPI that is not a rate.

export class AddStoreKpiMonthValueParts1799705100000 implements MigrationInterface {
  name = 'AddStoreKpiMonthValueParts1799705100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[store_kpi_month_values]
      ADD [numerator] decimal(19, 4) NULL,
          [denominator] decimal(19, 4) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[store_kpi_month_values]
      ADD CONSTRAINT [CK_store_kpi_month_values_parts] CHECK (
        ([numerator] IS NULL AND [denominator] IS NULL)
        OR ([numerator] IS NOT NULL AND [denominator] > 0)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[store_kpi_month_values]
      DROP CONSTRAINT [CK_store_kpi_month_values_parts]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[store_kpi_month_values]
      DROP COLUMN [numerator], [denominator]
    `);
  }
}
