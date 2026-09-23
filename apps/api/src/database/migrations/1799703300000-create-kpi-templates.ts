import type { MigrationInterface, QueryRunner } from 'typeorm';

// Reusable KPI templates (ADR-034): a named set of kpi_definitions with filled-in inputs
// and weights that add up to 100. Not bound to an employee or a period.

export class CreateKpiTemplates1799703300000 implements MigrationInterface {
  name = 'CreateKpiTemplates1799703300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_templates] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_templates_id] DEFAULT NEWSEQUENTIALID(),
        [name] nvarchar(200) NOT NULL,
        [description] nvarchar(1000) NULL,
        [is_active] bit NOT NULL
          CONSTRAINT [DF_kpi_templates_is_active] DEFAULT 1,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_templates_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_templates_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_kpi_templates] PRIMARY KEY ([id]),
        CONSTRAINT [CK_kpi_templates_name_not_blank] CHECK (LEN([name]) > 0)
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_kpi_templates_name]
      ON [dbo].[kpi_templates] ([name])
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[kpi_template_items] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_kpi_template_items_id] DEFAULT NEWSEQUENTIALID(),
        [template_id] uniqueidentifier NOT NULL,
        [kpi_definition_id] uniqueidentifier NOT NULL,
        [weight] decimal(5, 2) NOT NULL,
        [target_value] decimal(19, 4) NULL,
        [input_values] nvarchar(max) NOT NULL
          CONSTRAINT [DF_kpi_template_items_input_values] DEFAULT N'{}',
        [sort_order] int NOT NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_template_items_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_kpi_template_items_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_kpi_template_items] PRIMARY KEY ([id]),
        CONSTRAINT [FK_kpi_template_items_template]
          FOREIGN KEY ([template_id]) REFERENCES [dbo].[kpi_templates] ([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_kpi_template_items_definition]
          FOREIGN KEY ([kpi_definition_id]) REFERENCES [dbo].[kpi_definitions] ([id]),
        CONSTRAINT [CK_kpi_template_items_weight_range]
          CHECK ([weight] > 0 AND [weight] <= 100),
        CONSTRAINT [CK_kpi_template_items_target_non_negative]
          CHECK ([target_value] IS NULL OR [target_value] >= 0),
        CONSTRAINT [CK_kpi_template_items_input_values_json] CHECK (
          ISJSON([input_values]) = 1
          AND LEFT(LTRIM([input_values]), 1) = N'{'
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_template_items_template]
      ON [dbo].[kpi_template_items] ([template_id], [sort_order])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_kpi_template_items_definition]
      ON [dbo].[kpi_template_items] ([kpi_definition_id])
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE [dbo].[kpi_template_items]');
    await queryRunner.query('DROP TABLE [dbo].[kpi_templates]');
  }
}
