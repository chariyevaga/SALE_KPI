import { join } from 'node:path';

import type { DataSourceOptions } from 'typeorm';

import { getKpiDatabaseConfig } from '../config/environment.js';
import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { FileEntity } from '../files/entities/file.entity.js';

export function getKpiDataSourceOptions(): DataSourceOptions {
  const config = getKpiDatabaseConfig();

  return {
    type: 'mssql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [FileEntity, EmployeeEntity, DeviceSessionEntity, ErpEmployeeEntity],
    migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
    migrationsRun: false,
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    options: {
      encrypt: config.encrypt,
      trustServerCertificate: config.trustServerCertificate,
    },
  };
}
