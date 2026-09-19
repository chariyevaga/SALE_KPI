import type { MigrationInterface, QueryRunner } from 'typeorm';

// Record trail (ADR-036): `created_by` / `updated_by` on every table we own, next to the
// existing `created_at` / `updated_at`, plus the append-only `audit_logs` table. Existing
// rows keep NULL, which means "system or before tracking started".

const AUDITED_TABLES = [
  'files',
  'employees',
  'device_sessions',
  'kpi_definitions',
  'kpi_templates',
  'kpi_template_items',
] as const;

export class AddAuditColumnsAndAuditLogs1799703400000 implements MigrationInterface {
  name = 'AddAuditColumnsAndAuditLogs1799703400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of AUDITED_TABLES) {
      await queryRunner.query(`
        ALTER TABLE [dbo].[${table}] ADD
          [created_by] uniqueidentifier NULL,
          [updated_by] uniqueidentifier NULL
      `);

      await queryRunner.query(`
        ALTER TABLE [dbo].[${table}] ADD
          CONSTRAINT [FK_${table}_created_by]
            FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
          CONSTRAINT [FK_${table}_updated_by]
            FOREIGN KEY ([updated_by]) REFERENCES [dbo].[employees] ([id])
      `);
    }

    await queryRunner.query(`
      CREATE TABLE [dbo].[audit_logs] (
        [id] bigint IDENTITY(1, 1) NOT NULL,
        [table_name] nvarchar(128) NOT NULL,
        [record_id] uniqueidentifier NOT NULL,
        [action] nvarchar(16) NOT NULL,
        [changes] nvarchar(max) NOT NULL,
        [context] nvarchar(max) NULL,
        [request_id] uniqueidentifier NULL,
        [ip_address] nvarchar(45) NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_audit_logs_created_at] DEFAULT SYSUTCDATETIME(),
        [created_by] uniqueidentifier NULL,
        CONSTRAINT [PK_audit_logs] PRIMARY KEY ([id]),
        CONSTRAINT [FK_audit_logs_created_by]
          FOREIGN KEY ([created_by]) REFERENCES [dbo].[employees] ([id]),
        CONSTRAINT [CK_audit_logs_action]
          CHECK ([action] IN (N'create', N'update', N'delete')),
        CONSTRAINT [CK_audit_logs_changes_json] CHECK (
          ISJSON([changes]) = 1
          AND LEFT(LTRIM([changes]), 1) = N'{'
        ),
        CONSTRAINT [CK_audit_logs_context_json] CHECK (
          [context] IS NULL
          OR (ISJSON([context]) = 1 AND LEFT(LTRIM([context]), 1) = N'{')
        )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_audit_logs_record]
      ON [dbo].[audit_logs] ([table_name], [record_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_audit_logs_created_by]
      ON [dbo].[audit_logs] ([created_by])
      WHERE [created_by] IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE [dbo].[audit_logs]');

    for (const table of [...AUDITED_TABLES].reverse()) {
      await queryRunner.query(`
        ALTER TABLE [dbo].[${table}]
        DROP CONSTRAINT [FK_${table}_updated_by], [FK_${table}_created_by]
      `);
      await queryRunner.query(`
        ALTER TABLE [dbo].[${table}] DROP COLUMN [updated_by], [created_by]
      `);
    }
  }
}
