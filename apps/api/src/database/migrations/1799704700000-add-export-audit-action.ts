import type { MigrationInterface, QueryRunner } from 'typeorm';

// audit_logs.action gains `export` (ADR-059): downloading a KPI period's Excel file changes no
// row, but who took the scores and salaries out of the application, and when, belongs in the
// record's history like any change does. The entry sits on the kpi_periods row it came from.

export class AddExportAuditAction1799704700000 implements MigrationInterface {
  name = 'AddExportAuditAction1799704700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[audit_logs] DROP CONSTRAINT [CK_audit_logs_action]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [CK_audit_logs_action]
        CHECK ([action] IN (N'create', N'update', N'delete', N'export'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // The old constraint cannot hold export entries; reverting removes them with it.
    await queryRunner.query(`DELETE FROM [dbo].[audit_logs] WHERE [action] = N'export'`);
    await queryRunner.query(`
      ALTER TABLE [dbo].[audit_logs] DROP CONSTRAINT [CK_audit_logs_action]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [CK_audit_logs_action]
        CHECK ([action] IN (N'create', N'update', N'delete'))
    `);
  }
}
