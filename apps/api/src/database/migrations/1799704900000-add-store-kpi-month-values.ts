import type { MigrationInterface, QueryRunner } from 'typeorm';

// Monthly store KPI values for the store dashboard (ADR-061). The dashboard compares two
// calendar years month by month and must not compute from Tiger per request (ADR-010), so a
// scheduled job copies what `dbo.kpi_month_values` measures for each store into this table.
// The measures keep their single implementation (ADR-041); this table only stores them.
//
// store_nr is the Tiger iş yeri number (INVOICE.BRANCH = L_CAPIDIV.NR), an external
// reference. firm_nr keeps the values of one Tiger firm apart from another's if FIRM_NR ever
// changes. Record trail columns are part of the table from the start (ADR-036).

export class AddStoreKpiMonthValues1799704900000 implements MigrationInterface {
  name = 'AddStoreKpiMonthValues1799704900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[store_kpi_month_values] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_store_kpi_month_values_id] DEFAULT NEWSEQUENTIALID(),
        [firm_nr] int NOT NULL,
        [store_nr] int NOT NULL,
        [month_start] date NOT NULL,
        [kpi_code] nvarchar(64) NOT NULL,
        [currency] nvarchar(3) NULL,
        [value] decimal(19, 4) NOT NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_kpi_month_values_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_kpi_month_values_updated_at] DEFAULT SYSUTCDATETIME(),
        [updated_by] uniqueidentifier NULL,
        CONSTRAINT [PK_store_kpi_month_values] PRIMARY KEY ([id]),
        CONSTRAINT [FK_store_kpi_month_values_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_store_kpi_month_values_updated_by]
          FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [CK_store_kpi_month_values_month_start] CHECK (DAY([month_start]) = 1),
        CONSTRAINT [CK_store_kpi_month_values_currency]
          CHECK ([currency] IS NULL OR [currency] IN (N'TMT', N'USD'))
      )
    `);

    // One value per firm, store, month, KPI and currency; SQL Server treats the NULL
    // currency of the non-money KPIs as one value, so they are unique too.
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_store_kpi_month_values_key]
      ON [dbo].[store_kpi_month_values] ([firm_nr], [month_start], [store_nr], [kpi_code], [currency])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [dbo].[store_kpi_month_values]`);
  }
}
