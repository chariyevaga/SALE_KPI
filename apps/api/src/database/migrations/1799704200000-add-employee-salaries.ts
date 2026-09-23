import type { MigrationInterface, QueryRunner } from 'typeorm';

// Employee salaries (ADR-048). A salary is entered with the month it takes effect from; the
// salary of a month is the latest one on or before it. Each salary splits into a fixed part
// and a KPI part whose percentages add up to 100. Only full_access users read or write them.
// Record trail columns are part of the table from the start (ADR-036).

export class AddEmployeeSalaries1799704200000 implements MigrationInterface {
  name = 'AddEmployeeSalaries1799704200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[employee_salaries] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_employee_salaries_id] DEFAULT NEWSEQUENTIALID(),
        [employee_id] uniqueidentifier NOT NULL,
        [effective_month] date NOT NULL,
        [amount] decimal(19, 2) NOT NULL,
        [currency] nvarchar(3) NOT NULL
          CONSTRAINT [DF_employee_salaries_currency] DEFAULT N'TMT',
        [fixed_percent] decimal(5, 2) NOT NULL,
        [kpi_percent] decimal(5, 2) NOT NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_employee_salaries_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_employee_salaries_updated_at] DEFAULT SYSUTCDATETIME(),
        [updated_by] uniqueidentifier NULL,
        CONSTRAINT [PK_employee_salaries] PRIMARY KEY ([id]),
        CONSTRAINT [FK_employee_salaries_employee]
          FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_employee_salaries_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_employee_salaries_updated_by]
          FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id]),
        -- A salary takes effect from the first day of a month.
        CONSTRAINT [CK_employee_salaries_effective_month] CHECK (DAY([effective_month]) = 1),
        CONSTRAINT [CK_employee_salaries_amount] CHECK ([amount] > 0),
        CONSTRAINT [CK_employee_salaries_currency] CHECK ([currency] IN (N'TMT', N'USD')),
        CONSTRAINT [CK_employee_salaries_percents] CHECK (
          [fixed_percent] >= 0 AND [kpi_percent] >= 0 AND [fixed_percent] + [kpi_percent] = 100
        )
      )
    `);

    // One salary per employee and month; the latest month on or before a date is in force.
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_employee_salaries_employee_month]
      ON [dbo].[employee_salaries] ([employee_id], [effective_month])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [dbo].[employee_salaries]`);
  }
}
