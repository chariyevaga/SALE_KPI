import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1799702800000 implements MigrationInterface {
  name = 'CreateFiles1799702800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE [dbo].[files] (
        [id] uniqueidentifier NOT NULL
          CONSTRAINT [DF_files_id] DEFAULT NEWSEQUENTIALID(),
        [original_name] nvarchar(255) NOT NULL,
        [storage_key] nvarchar(255) NOT NULL,
        [mime_type] nvarchar(127) NOT NULL,
        [size_bytes] int NOT NULL,
        [source_table] nvarchar(128) NULL,
        [source_field] nvarchar(128) NULL,
        [source_id] nvarchar(128) NULL,
        [created_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_files_created_at] DEFAULT SYSUTCDATETIME(),
        [updated_at] datetime2(3) NOT NULL
          CONSTRAINT [DF_files_updated_at] DEFAULT SYSUTCDATETIME(),
        CONSTRAINT [PK_files] PRIMARY KEY ([id]),
        CONSTRAINT [UQ_files_storage_key] UNIQUE ([storage_key]),
        CONSTRAINT [CK_files_size_bytes_positive] CHECK ([size_bytes] > 0),
        CONSTRAINT [CK_files_source_all_or_none] CHECK (
          ([source_table] IS NULL AND [source_field] IS NULL AND [source_id] IS NULL)
          OR
          ([source_table] IS NOT NULL AND [source_field] IS NOT NULL AND [source_id] IS NOT NULL)
        )
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE [dbo].[files]');
  }
}
