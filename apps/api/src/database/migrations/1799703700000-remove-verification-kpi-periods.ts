import type { MigrationInterface, QueryRunner } from 'typeorm';

// Removes the KPI periods left behind by the 2026-09-20 verification of ADR-039: the
// 2000-01 period opened to test closing, and the 2026-09 period that the same test closed
// by accident. A closed period cannot be reopened (open business decision 11), so the row
// is deleted and the month can be opened again from the screen.
//
// Only periods without plans are touched, so the statement is a no-op on a database where
// those months carry real work. Deleting rows from a migration is a system write: it does
// not appear in audit_logs (ADR-036).

export class RemoveVerificationKpiPeriods1799703700000 implements MigrationInterface {
  name = 'RemoveVerificationKpiPeriods1799703700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM [dbo].[kpi_periods]
      WHERE (
        ([year] = 2000 AND [month] = 1)
        OR ([year] = 2026 AND [month] = 9 AND [status] = N'closed')
      )
      AND NOT EXISTS (
        SELECT 1 FROM [dbo].[kpi_assignments] a WHERE a.[period_id] = [dbo].[kpi_periods].[id]
      )
    `);
  }

  public async down(): Promise<void> {
    // Nothing to restore: the deleted rows were verification leftovers with no plans.
  }
}
