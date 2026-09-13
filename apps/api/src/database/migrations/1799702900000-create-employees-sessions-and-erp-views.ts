import type { MigrationInterface, QueryRunner } from 'typeorm';

import { getKpiDatabaseConfig, getTigerDatabaseConfig } from '../../config/environment.js';

function quoteIdentifier(value: string): string {
  if (!value || value.length > 128) {
    throw new Error('TIGER_DB_NAME must contain between 1 and 128 characters.');
  }

  return `[${value.replaceAll(']', ']]')}]`;
}

export class CreateEmployeesSessionsAndErpViews1799702900000 implements MigrationInterface {
  name = 'CreateEmployeesSessionsAndErpViews1799702900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const kpi = getKpiDatabaseConfig();
    const tiger = getTigerDatabaseConfig();

    if (kpi.host.toLowerCase() !== tiger.host.toLowerCase() || kpi.port !== tiger.port) {
      throw new Error(
        'KPI_DB and TIGERDB must use the same SQL Server host and port for ERP views.',
      );
    }

    const tigerDatabase = quoteIdentifier(tiger.database);

    await queryRunner.query(`
      DROP INDEX [IX_files_orphan_cleanup] ON [dbo].[files]
    `);

    await queryRunner.query(`
      DROP INDEX [UX_files_source_reference] ON [dbo].[files]
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[files] DROP CONSTRAINT [CK_files_source_all_or_none]
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[files] DROP CONSTRAINT [UQ_files_storage_key]
    `);

    await queryRunner.query(`
      EXEC sp_rename N'[dbo].[files].[storage_key]', N'file_name', N'COLUMN'
    `);

    await queryRunner.query(`
      EXEC sp_rename N'[dbo].[files].[source_id]', N'source_table_id', N'COLUMN'
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[files]
      ADD CONSTRAINT [UQ_files_file_name] UNIQUE ([file_name])
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[files]
      ADD CONSTRAINT [CK_files_source_all_or_none] CHECK (
        ([source_table] IS NULL AND [source_field] IS NULL AND [source_table_id] IS NULL)
        OR
        ([source_table] IS NOT NULL AND [source_field] IS NOT NULL AND [source_table_id] IS NOT NULL)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_files_orphan_cleanup]
      ON [dbo].[files] ([source_table_id], [created_at])
      INCLUDE ([file_name])
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_files_source_reference]
      ON [dbo].[files] ([source_table], [source_field], [source_table_id])
      WHERE [source_table_id] IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[files] ADD
        [big_image] nvarchar(255) NULL,
        [medium_image] nvarchar(255) NULL,
        [small_image] nvarchar(255) NULL,
        [blurhash] nvarchar(255) NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_files_big_image]
      ON [dbo].[files] ([big_image])
      WHERE [big_image] IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_files_medium_image]
      ON [dbo].[files] ([medium_image])
      WHERE [medium_image] IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_files_small_image]
      ON [dbo].[files] ([small_image])
      WHERE [small_image] IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[employees] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_employees_id] DEFAULT NEWSEQUENTIALID(),
        [username] nvarchar(100) NOT NULL,
        [email] nvarchar(320) NULL,
        [password_hash] nvarchar(255) NOT NULL,
        [firstname] nvarchar(100) NOT NULL,
        [lastname] nvarchar(100) NOT NULL,
        [phone_number] nvarchar(32) NULL,
        [erp_employee_id] int NULL,
        [avatar_id] uniqueidentifier NULL,
        [is_active] bit NOT NULL
          CONSTRAINT [DF_employees_is_active] DEFAULT 1,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_employees_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_employees_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_employees] PRIMARY KEY ([id]),
        CONSTRAINT [FK_employees_avatar]
          FOREIGN KEY ([avatar_id]) REFERENCES [dbo].[files] ([id]) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_employees_username]
      ON [dbo].[employees] ([username])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_employees_erp_employee_id]
      ON [dbo].[employees] ([erp_employee_id])
      WHERE [erp_employee_id] IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_employees_avatar_id]
      ON [dbo].[employees] ([avatar_id])
      WHERE [avatar_id] IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE [dbo].[device_sessions] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_device_sessions_id] DEFAULT NEWSEQUENTIALID(),
        [employee_id] uniqueidentifier NOT NULL,
        [device_id] nvarchar(128) NOT NULL,
        [device_name] nvarchar(255) NULL,
        [user_agent] nvarchar(1024) NULL,
        [ip_address] nvarchar(45) NULL,
        [refresh_token_hash] nvarchar(255) NOT NULL,
        [token_family_id] uniqueidentifier NOT NULL,
        [token_version] int NOT NULL
          CONSTRAINT [DF_device_sessions_token_version] DEFAULT 1,
        [expires_at] datetime2(3) NOT NULL,
        [last_seen_at] datetime2(3) NOT NULL,
        [revoked_at] datetime2(3) NULL,
        [revocation_reason] nvarchar(255) NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_device_sessions_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_device_sessions_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_device_sessions] PRIMARY KEY ([id]),
        CONSTRAINT [CK_device_sessions_token_version_positive]
          CHECK ([token_version] > 0),
        CONSTRAINT [FK_device_sessions_employee]
          FOREIGN KEY ([employee_id]) REFERENCES [dbo].[employees] ([id]) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_device_sessions_employee_device]
      ON [dbo].[device_sessions] ([employee_id], [device_id])
    `);

    await queryRunner.query(`
      CREATE INDEX [IX_device_sessions_active_employee]
      ON [dbo].[device_sessions] ([employee_id], [expires_at])
      WHERE [revoked_at] IS NULL
    `);

    await queryRunner.query(`
      CREATE OR ALTER VIEW [dbo].[stores]
      AS
      SELECT
        [LOGICALREF] AS [id],
        [FIRMNR] AS [firm_nr],
        [NR] AS [nr],
        [NAME] AS [name],
        [STREET] AS [street],
        [DOORNR] AS [door_nr],
        [DISTRICT] AS [district],
        [CITY] AS [city],
        [COUNTRY] AS [country],
        [ZIPCODE] AS [zip_code],
        [PHONE] AS [phone]
      FROM ${tigerDatabase}.[dbo].[L_CAPIDIV]
    `);

    await queryRunner.query(`
      CREATE OR ALTER VIEW [dbo].[erp_employees]
      AS
      SELECT
        [LOGICALREF] AS [id],
        [FIRMNR] AS [firm_nr],
        [CODE] AS [code],
        [DEFINITION_] AS [name],
        [TELNUMBER] AS [phone_number],
        [SPECODE] AS [specode],
        CAST(CASE WHEN [ACTIVE] = 0 THEN 1 ELSE 0 END AS bit) AS [is_active],
        CONVERT(datetime2(0), [CAPIBLOCK_CREADEDDATE], 126)
          AT TIME ZONE 'West Asia Standard Time' AS [created_at],
        CONVERT(datetime2(0), [CAPIBLOCK_MODIFIEDDATE], 126)
          AT TIME ZONE 'West Asia Standard Time' AS [updated_at]
      FROM ${tigerDatabase}.[dbo].[LG_SLSMAN]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP VIEW IF EXISTS [dbo].[erp_employees]');
    await queryRunner.query('DROP VIEW IF EXISTS [dbo].[stores]');
    await queryRunner.query('DROP TABLE [dbo].[device_sessions]');
    await queryRunner.query('DROP TABLE [dbo].[employees]');
    await queryRunner.query('DROP INDEX [UX_files_small_image] ON [dbo].[files]');
    await queryRunner.query('DROP INDEX [UX_files_medium_image] ON [dbo].[files]');
    await queryRunner.query('DROP INDEX [UX_files_big_image] ON [dbo].[files]');
    await queryRunner.query(`
      ALTER TABLE [dbo].[files]
      DROP COLUMN [blurhash], [small_image], [medium_image], [big_image]
    `);
    await queryRunner.query('DROP INDEX [UX_files_source_reference] ON [dbo].[files]');
    await queryRunner.query('DROP INDEX [IX_files_orphan_cleanup] ON [dbo].[files]');
    await queryRunner.query(
      'ALTER TABLE [dbo].[files] DROP CONSTRAINT [CK_files_source_all_or_none]',
    );
    await queryRunner.query('ALTER TABLE [dbo].[files] DROP CONSTRAINT [UQ_files_file_name]');
    await queryRunner.query(`
      EXEC sp_rename N'[dbo].[files].[source_table_id]', N'source_id', N'COLUMN'
    `);
    await queryRunner.query(`
      EXEC sp_rename N'[dbo].[files].[file_name]', N'storage_key', N'COLUMN'
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[files]
      ADD CONSTRAINT [UQ_files_storage_key] UNIQUE ([storage_key])
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[files]
      ADD CONSTRAINT [CK_files_source_all_or_none] CHECK (
        ([source_table] IS NULL AND [source_field] IS NULL AND [source_id] IS NULL)
        OR
        ([source_table] IS NOT NULL AND [source_field] IS NOT NULL AND [source_id] IS NOT NULL)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX [IX_files_orphan_cleanup]
      ON [dbo].[files] ([source_id], [created_at])
      INCLUDE ([storage_key])
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX [UX_files_source_reference]
      ON [dbo].[files] ([source_table], [source_field], [source_id])
      WHERE [source_id] IS NOT NULL
    `);
  }
}
