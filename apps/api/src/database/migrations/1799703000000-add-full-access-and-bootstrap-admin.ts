import type { MigrationInterface, QueryRunner } from 'typeorm';

import { hashPasswordSync } from '../../auth/password-hash.js';

const BOOTSTRAP_ADMIN_ID = '00000000-0000-4000-8000-000000000001';

export class AddFullAccessAndBootstrapAdmin1799703000000 implements MigrationInterface {
  name = 'AddFullAccessAndBootstrapAdmin1799703000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] ADD
        [full_access] bit NOT NULL
          CONSTRAINT [DF_employees_full_access] DEFAULT 0
    `);

    const passwordHash = hashPasswordSync('admin');

    await queryRunner.query(
      `
        IF NOT EXISTS (
          SELECT 1 FROM [dbo].[employees] WHERE [username] = N'admin'
        )
        BEGIN
          INSERT INTO [dbo].[employees] (
            [id], [username], [email], [password_hash], [firstname], [lastname],
            [phone_number], [erp_employee_id], [avatar_id], [is_active], [full_access]
          )
          VALUES (
            @0, N'admin', NULL, @1, N'System', N'Administrator',
            NULL, NULL, NULL, 1, 1
          )
        END
      `,
      [BOOTSTRAP_ADMIN_ID, passwordHash],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM [dbo].[employees] WHERE [id] = @0', [
      BOOTSTRAP_ADMIN_ID,
    ]);
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP CONSTRAINT [DF_employees_full_access]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP COLUMN [full_access]
    `);
  }
}
