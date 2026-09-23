import type { DataSourceOptions } from 'typeorm';

import { getTigerDatabaseConfig } from '../config/environment.js';

/** Nest connection name of the Tiger data source; inject with `@InjectDataSource(TIGER)`. */
export const TIGER = 'tiger';

/**
 * Read-only connection to Logo Tiger for KPI calculations (ADR-037). It has no entities,
 * subscribers or migrations: Tiger is read with parameterised SQL only, and the account
 * in TIGER_DB_USER must hold nothing more than db_datareader on TIGER_DB_NAME.
 */
export function getTigerDataSourceOptions(): DataSourceOptions {
  const config = getTigerDatabaseConfig();

  return {
    type: 'mssql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [],
    subscribers: [],
    migrations: [],
    migrationsRun: false,
    synchronize: false,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
      // Same reason as KPI_DB: datetime values must not shift with the process time zone.
      useUTC: true,
    },
  };
}
