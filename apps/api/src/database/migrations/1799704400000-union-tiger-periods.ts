import type { MigrationInterface, QueryRunner } from 'typeorm';

import {
  getTigerDatabaseConfig,
  getTigerPeriodNumbers,
  getTigerSharedCustomerCodes,
} from '../../config/environment.js';
import { TigerTables } from '../../tiger/tiger-tables.js';

// Several Logo periods in one measure (ADR-054). Logo opens a new set of period tables
// (LG_003_02_INVOICE, …) for a new fiscal period; with a single period, customers of the
// earlier one would count as "new" again. dbo.tiger_invoice and dbo.tiger_stline stop being
// synonyms of one period's tables and become views over every period of TIGER_PERIOD_NRS.
//
// Each period numbers its rows from 1, so invoice 5 of period 1 and invoice 5 of period 2
// would meet. Both views therefore carry period × 2^32 + LOGICALREF as the invoice key, which
// no int reference can collide with; every view above joins on those keys unchanged.
//
// SQL is inlined on purpose: a migration is a snapshot (ADR-038).

const PERIOD_KEY = 'CAST(4294967296 AS bigint)';

function quoteIdentifier(value: string): string {
  if (!value || value.length > 128) {
    throw new Error('TIGER_DB_NAME must contain between 1 and 128 characters.');
  }

  return `[${value.replaceAll(']', ']]')}]`;
}

function quoteString(value: string): string {
  return `N'${value.replaceAll("'", "''")}'`;
}

function invoiceViewSql(database: string, firm: number, periods: readonly number[]): string {
  const branches = periods.map((period) => {
    const table = new TigerTables(firm, period).periodTable('INVOICE');

    return `
      SELECT
        CAST(${period} AS int) AS [PERIOD_NR],
        ${PERIOD_KEY} * ${period} + i.[LOGICALREF] AS [LOGICALREF],
        i.[TRCODE], i.[CANCELLED], i.[DATE_], i.[TIME_], i.[BRANCH], i.[SALESMANREF],
        i.[CLIENTREF], i.[NETTOTAL], i.[TOTALVAT], i.[REPORTNET]
      FROM ${database}.[dbo].${table} i`;
  });

  return `
    CREATE OR ALTER VIEW [dbo].[tiger_invoice]
    AS
    -- Sales invoices of every configured Logo period (ADR-054); LOGICALREF is period-keyed.
    ${branches.join('\n      UNION ALL')}
  `;
}

function lineViewSql(database: string, firm: number, periods: readonly number[]): string {
  const branches = periods.map((period) => {
    const table = new TigerTables(firm, period).periodTable('STLINE');

    return `
      SELECT
        CAST(${period} AS int) AS [PERIOD_NR],
        ${PERIOD_KEY} * ${period} + l.[INVOICEREF] AS [INVOICEREF],
        l.[LINETYPE], l.[STOCKREF], l.[LINENET]
      FROM ${database}.[dbo].${table} l`;
  });

  return `
    CREATE OR ALTER VIEW [dbo].[tiger_stline]
    AS
    -- Invoice lines of every configured Logo period (ADR-054); INVOICEREF is period-keyed.
    ${branches.join('\n      UNION ALL')}
  `;
}

/** The report settings, now also saying which periods the views read (schema-check). */
function settingsViewSql(
  firm: number,
  sharedCustomerCodes: readonly string[],
  periods: readonly number[],
): string {
  return `
    CREATE OR ALTER VIEW [dbo].[kpi_report_settings]
    AS
    -- Tiger settings the report views were built with; schema-check compares them with .env.
    SELECT
      CAST(${firm} AS int) AS [firm_nr],
      CAST(${quoteString(sharedCustomerCodes.join(','))} AS nvarchar(4000)) AS [shared_customer_codes],
      CAST(${quoteString(periods.join(','))} AS nvarchar(400)) AS [period_nrs]
  `;
}

export class UnionTigerPeriods1799704400000 implements MigrationInterface {
  name = 'UnionTigerPeriods1799704400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = TigerTables.fromEnvironment();
    const database = quoteIdentifier(getTigerDatabaseConfig().database);
    const periods = getTigerPeriodNumbers();

    // A view cannot take a synonym's name while the synonym exists.
    await queryRunner.query('DROP SYNONYM IF EXISTS [dbo].[tiger_invoice]');
    await queryRunner.query('DROP SYNONYM IF EXISTS [dbo].[tiger_stline]');
    await queryRunner.query(invoiceViewSql(database, tables.firm, periods));
    await queryRunner.query(lineViewSql(database, tables.firm, periods));
    await queryRunner.query(settingsViewSql(tables.firm, getTigerSharedCustomerCodes(), periods));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = TigerTables.fromEnvironment();
    const database = quoteIdentifier(getTigerDatabaseConfig().database);

    await queryRunner.query('DROP VIEW IF EXISTS [dbo].[tiger_invoice]');
    await queryRunner.query('DROP VIEW IF EXISTS [dbo].[tiger_stline]');
    await queryRunner.query(
      `CREATE SYNONYM [dbo].[tiger_invoice] FOR ${database}.[dbo].${tables.periodTable('INVOICE')}`,
    );
    await queryRunner.query(
      `CREATE SYNONYM [dbo].[tiger_stline] FOR ${database}.[dbo].${tables.periodTable('STLINE')}`,
    );
    await queryRunner.query(`
      CREATE OR ALTER VIEW [dbo].[kpi_report_settings]
      AS
      SELECT
        CAST(${tables.firm} AS int) AS [firm_nr],
        CAST(${quoteString(getTigerSharedCustomerCodes().join(','))} AS nvarchar(4000)) AS [shared_customer_codes]
    `);
  }
}
