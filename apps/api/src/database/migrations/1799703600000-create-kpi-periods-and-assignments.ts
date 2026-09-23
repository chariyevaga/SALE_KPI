import type { MigrationInterface, QueryRunner } from 'typeorm';

// KPI plans (ADR-039): a monthly period, the template assigned to an employee for that
// period and the KPI rows copied from the template with the employee's own targets.
// Record trail columns are part of the tables from the start (ADR-036).

const AUDITED_TABLES = ['kpi_periods', 'kpi_assignments', 'kpi_assignment_items'] as const;

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

export class CreateKpiPeriodsAndAssignments1799703600000 implements MigrationInterface {
  name = 'CreateKpiPeriodsAndAssignments1799703600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_periods] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_periods_id] DEFAULT NEWSEQUENTIALID(),
        [year] smallint NOT NULL,
        [month] tinyint NOT NULL,
        [status] nvarchar(16) NOT NULL
          CONSTRAINT [DF_kpi_periods_status] DEFAULT N'open',
        [closed_at] datetime2(3) NULL,${auditColumns('kpi_periods')},
        CONSTRAINT [PK_kpi_periods] PRIMARY KEY ([id]),${auditForeignKeys('kpi_periods')},
        CONSTRAINT [CK_kpi_periods_year_range] CHECK ([year] BETWEEN 2000 AND 2100),
        CONSTRAINT [CK_kpi_periods_month_range] CHECK ([month] BETWEEN 1 AND 12),
        CONSTRAINT [CK_kpi_periods_status] CHECK ([status] IN (N'open', N'closed')),
        CONSTRAINT [CK_kpi_periods_closed_at] CHECK (
          ([status] = N'closed' AND [closed_at] IS NOT NULL)
          OR ([status] = N'open' AND [closed_at] IS NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_kpi_periods_year_month]
      ON [dbo].[kpi_periods] ([year], [month])
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_assignments] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_assignments_id] DEFAULT NEWSEQUENTIALID(),
        [period_id] uniqueidentifier NOT NULL,
        [employee_id] uniqueidentifier NOT NULL,
        [template_id] uniqueidentifier NOT NULL,
        [template_name] nvarchar(200) NOT NULL,${auditColumns('kpi_assignments')},
        CONSTRAINT [PK_kpi_assignments] PRIMARY KEY ([id]),${auditForeignKeys('kpi_assignments')},
        CONSTRAINT [FK_kpi_assignments_period]
          FOREIGN KEY ([period_id]) REFERENCES [dbo].[kpi_periods] ([id]),
        CONSTRAINT [FK_kpi_assignments_employee]
          FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_kpi_assignments_template]
          FOREIGN KEY ([template_id]) REFERENCES [dbo].[kpi_templates] ([id]),
        CONSTRAINT [CK_kpi_assignments_template_name_not_blank]
          CHECK (LEN([template_name]) > 0)
      )
    `);

    // One plan per employee and period: a salesperson belongs to a single KPI group in a
    // period (docs/BUSINESS_RULES.md "Organizasyon").
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_kpi_assignments_period_employee]
      ON [dbo].[kpi_assignments] ([period_id], [employee_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_assignments_employee]
      ON [dbo].[kpi_assignments] ([employee_id], [period_id])
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_assignment_items] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_assignment_items_id] DEFAULT NEWSEQUENTIALID(),
        [assignment_id] uniqueidentifier NOT NULL,
        [kpi_definition_id] uniqueidentifier NOT NULL,
        [weight] decimal(5, 2) NOT NULL,
        [target_value] decimal(19, 4) NULL,
        [input_values] nvarchar(max) NOT NULL
          CONSTRAINT [DF_kpi_assignment_items_input_values] DEFAULT N'{}',
        [sort_order] int NOT NULL,${auditColumns('kpi_assignment_items')},
        CONSTRAINT [PK_kpi_assignment_items] PRIMARY KEY ([id]),${auditForeignKeys('kpi_assignment_items')},
        CONSTRAINT [FK_kpi_assignment_items_assignment]
          FOREIGN KEY ([assignment_id]) REFERENCES [dbo].[kpi_assignments] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_kpi_assignment_items_definition]
          FOREIGN KEY ([kpi_definition_id]) REFERENCES [dbo].[kpi_definitions] ([id]),
        CONSTRAINT [CK_kpi_assignment_items_weight_range]
          CHECK ([weight] > 0 AND [weight] <= 100),
        CONSTRAINT [CK_kpi_assignment_items_target_non_negative]
          CHECK ([target_value] IS NULL OR [target_value] >= 0),
        CONSTRAINT [CK_kpi_assignment_items_input_values_json] CHECK (
          ISJSON([input_values]) = 1
          AND LEFT(LTRIM([input_values]), 1) = N'{'
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_assignment_items_assignment]
      ON [dbo].[kpi_assignment_items] ([assignment_id], [sort_order])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_assignment_items_definition]
      ON [dbo].[kpi_assignment_items] ([kpi_definition_id])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [...AUDITED_TABLES].reverse()) {
      await queryRunner.query(`DROP TABLE [dbo].[${table}]`);
    }
  }
}
