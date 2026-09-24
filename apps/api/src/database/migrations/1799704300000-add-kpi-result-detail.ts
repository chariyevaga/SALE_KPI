import type { MigrationInterface, QueryRunner } from 'typeorm';

// How a result was reached, for results whose number needs explaining (ADR-052): today the
// store conversion, which only counts the days a visitor count was entered. JSON, written
// by the calculation; NULL for every other KPI.

export class AddKpiResultDetail1799704300000 implements MigrationInterface {
  name = 'AddKpiResultDetail1799704300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[kpi_results] ADD
        [detail] nvarchar(max) NULL,
        CONSTRAINT [CK_kpi_results_detail_json] CHECK ([detail] IS NULL OR ISJSON([detail]) = 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[kpi_results] DROP CONSTRAINT [CK_kpi_results_detail_json]
    `);
    await queryRunner.query(`ALTER TABLE [dbo].[kpi_results] DROP COLUMN [detail]`);
  }
}
