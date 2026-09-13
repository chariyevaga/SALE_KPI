import '../config/load-environment.js';
import 'reflect-metadata';

import { getFirmNumber } from '../config/environment.js';
import dataSource from './data-source.js';

const REQUIRED_OBJECTS = [
  { name: 'dbo.files', type: 'U' },
  { name: 'dbo.employees', type: 'U' },
  { name: 'dbo.device_sessions', type: 'U' },
  { name: 'dbo.stores', type: 'V' },
  { name: 'dbo.erp_employees', type: 'V' },
] as const;

async function objectExists(name: string, type: string): Promise<boolean> {
  const rows = await dataSource.query<Array<{ object_id: number | null }>>(
    'SELECT OBJECT_ID(@0, @1) AS [object_id]',
    [name, type],
  );

  return rows[0]?.object_id !== null && rows[0]?.object_id !== undefined;
}

async function getPendingMigrationNames(): Promise<string[]> {
  const configuredNames = dataSource.migrations.map((migration) => {
    if (!migration.name) {
      throw new Error('Every configured migration must have a name.');
    }

    return migration.name;
  });

  if (!(await objectExists('dbo.typeorm_migrations', 'U'))) {
    return configuredNames;
  }

  const executed = await dataSource.query<Array<{ name: string }>>(
    'SELECT [name] FROM [dbo].[typeorm_migrations]',
  );
  const executedNames = new Set(executed.map((migration) => migration.name));

  return configuredNames.filter((name) => !executedNames.has(name));
}

async function checkSchema(): Promise<void> {
  getFirmNumber();
  await dataSource.initialize();

  try {
    const pendingMigrations = await getPendingMigrationNames();

    if (pendingMigrations.length > 0) {
      throw new Error(
        `Pending KPI_DB migrations found (${pendingMigrations.join(', ')}). Run: npm run migration:run`,
      );
    }

    const missing: string[] = [];

    for (const object of REQUIRED_OBJECTS) {
      if (!(await objectExists(object.name, object.type))) {
        missing.push(object.name);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Required KPI_DB tables/views are missing: ${missing.join(', ')}`);
    }

    console.log('KPI_DB migration and required table/view checks passed.');
  } finally {
    await dataSource.destroy();
  }
}

checkSchema().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Schema check failed: ${message}`);
  process.exitCode = 1;
});
