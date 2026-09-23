import type { MigrationInterface, QueryRunner } from 'typeorm';

// Removes the EMPLOYEE_DISCIPLINE KPI (ADR-046): discipline is no longer measured. The row is
// deleted, not deactivated, so the KPI disappears from the catalog, the template form and the
// plans.
//
// Template and plan rows carry weights that must add up to 100 (ADR-034), so the migration
// does not silently drop rows that use the KPI: it stops instead, and those templates and
// plans have to be edited first. Deleting a row from a migration is a system write: it does
// not appear in audit_logs (ADR-036).

const CODE = 'EMPLOYEE_DISCIPLINE';

// The seed row of 1799703200000, inlined: a migration is a snapshot.
const DEFINITION = {
  scope: 'employee',
  unit: 'score',
  inputMode: 'manual',
  sortOrder: 140,
  name: {
    tr: 'Tertip ve disiplin',
    en: 'Order and discipline',
    ru: 'Порядок и дисциплина',
    tk: 'Tertip we düzgün-nyzam',
  },
  inputSchema: [],
};

export class RemoveEmployeeDisciplineKpi1799704100000 implements MigrationInterface {
  name = 'RemoveEmployeeDisciplineKpi1799704100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [usage] = (await queryRunner.query(
      `
        SELECT
          (SELECT COUNT(*) FROM [dbo].[kpi_template_items] ti
            WHERE ti.[kpi_definition_id] = d.[id]) AS [templateItems],
          (SELECT COUNT(*) FROM [dbo].[kpi_assignment_items] ai
            WHERE ai.[kpi_definition_id] = d.[id]) AS [assignmentItems],
          (SELECT COUNT(*) FROM [dbo].[kpi_results] r
            WHERE r.[kpi_definition_id] = d.[id]) AS [results]
        FROM [dbo].[kpi_definitions] d
        WHERE d.[code] = @0
      `,
      [CODE],
    )) as { templateItems: number; assignmentItems: number; results: number }[];

    if (usage && (usage.templateItems > 0 || usage.assignmentItems > 0 || usage.results > 0)) {
      throw new Error(
        `${CODE} is still used by ${usage.templateItems} template row(s), ` +
          `${usage.assignmentItems} plan row(s) and ${usage.results} result row(s). ` +
          'Remove it from those templates and plans, then run the migration again.',
      );
    }

    await queryRunner.query('DELETE FROM [dbo].[kpi_definitions] WHERE [code] = @0', [CODE]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO [dbo].[kpi_definitions] (
          [code], [scope], [unit], [input_mode], [name], [input_schema], [sort_order]
        )
        SELECT @0, @1, @2, @3, @4, @5, @6
        WHERE NOT EXISTS (SELECT 1 FROM [dbo].[kpi_definitions] WHERE [code] = @0)
      `,
      [
        CODE,
        DEFINITION.scope,
        DEFINITION.unit,
        DEFINITION.inputMode,
        JSON.stringify(DEFINITION.name),
        JSON.stringify(DEFINITION.inputSchema),
        DEFINITION.sortOrder,
      ],
    );
  }
}
