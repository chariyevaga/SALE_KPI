import type { MigrationInterface, QueryRunner } from 'typeorm';

// Daily store visitor counts (ADR-043): how many people walked into a store on a day, the
// denominator of the conversion KPI (docs/BUSINESS_RULES.md "Dönüşüm"). Only employees with
// `can_enter_visitor_counts` may write them. Record trail columns are part of the table from
// the start (ADR-036).

export class AddStoreVisitorCounts1799703900000 implements MigrationInterface {
  name = 'AddStoreVisitorCounts1799703900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] ADD
        [can_enter_visitor_counts] bit NOT NULL
          CONSTRAINT [DF_employees_can_enter_visitor_counts] DEFAULT 0
    `);

    // store_id is the Tiger L_CAPIDIV LOGICALREF of dbo.stores, the same value KPI inputs
    // keep in storeIds; it is an external reference, not a key of ours.
    await queryRunner.query(`
      CREATE TABLE [dbo].[store_visitor_counts] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_store_visitor_counts_id] DEFAULT NEWSEQUENTIALID(),
        [store_id] int NOT NULL,
        [visit_date] date NOT NULL,
        [visitor_count] int NOT NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_visitor_counts_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_store_visitor_counts_updated_at] DEFAULT SYSUTCDATETIME(),
        [updated_by] uniqueidentifier NULL,
        CONSTRAINT [PK_store_visitor_counts] PRIMARY KEY ([id]),
        CONSTRAINT [FK_store_visitor_counts_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [FK_store_visitor_counts_updated_by]
          FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [CK_store_visitor_counts_visitor_count]
          CHECK ([visitor_count] >= 0 AND [visitor_count] <= 1000000)
      )
    `);

    // One count per store and day; entering the day again replaces it.
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_store_visitor_counts_store_date]
      ON [dbo].[store_visitor_counts] ([store_id], [visit_date])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [dbo].[store_visitor_counts]`);
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP CONSTRAINT [DF_employees_can_enter_visitor_counts]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP COLUMN [can_enter_visitor_counts]
    `);
  }
}
