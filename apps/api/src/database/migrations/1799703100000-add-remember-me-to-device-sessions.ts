import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRememberMeToDeviceSessions1799703100000 implements MigrationInterface {
  name = 'AddRememberMeToDeviceSessions1799703100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[device_sessions] ADD
        [remember_me] bit NOT NULL
          CONSTRAINT [DF_device_sessions_remember_me] DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[device_sessions] DROP CONSTRAINT [DF_device_sessions_remember_me]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[device_sessions] DROP COLUMN [remember_me]
    `);
  }
}
