import type { MigrationInterface, QueryRunner } from 'typeorm';

// Job title and default store of an employee (ADR-058). Both are shown on the employee card
// to every signed-in user; the default store also filters the leaderboard.
//
// job_title is required by the API for new employees and can no longer be cleared, but the
// column stays nullable: nobody knows the job of the employees that already exist, so they
// keep NULL until their form is saved once (the form asks for it).
//
// default_store_id is the Tiger L_CAPIDIV LOGICALREF of dbo.stores, the same value KPI inputs
// keep in storeIds; it is an external reference, not a key of ours.

export class AddEmployeeJobTitleAndDefaultStore1799704600000 implements MigrationInterface {
  name = 'AddEmployeeJobTitleAndDefaultStore1799704600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] ADD
        [job_title] nvarchar(100) NULL,
        [default_store_id] int NULL
    `);

    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] ADD
        CONSTRAINT [CK_employees_job_title] CHECK ([job_title] IS NULL OR LEN([job_title]) > 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP CONSTRAINT [CK_employees_job_title]
    `);
    await queryRunner.query(`
      ALTER TABLE [dbo].[employees] DROP COLUMN [job_title], [default_store_id]
    `);
  }
}
