import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(scriptDirectory, '..');
const executable = resolve(
  apiRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);
const typeormCli = resolve(apiRoot, 'node_modules', 'typeorm', 'cli.js');
const providedName = process.argv[2];

if (process.argv.length > 3) {
  throw new Error('Provide at most one migration name.');
}

if (providedName && !/^[A-Za-z][A-Za-z0-9]*$/.test(providedName)) {
  throw new Error('Migration name must start with a letter and contain only letters and numbers.');
}

const migrationsDirectory = resolve(apiRoot, 'src/database/migrations');
const dataSource = resolve(apiRoot, 'src/database/data-source.ts');
const latestMigrationTimestamp = readdirSync(migrationsDirectory).reduce((latest, fileName) => {
  const timestamp = Number.parseInt(fileName.split('-', 1)[0] ?? '', 10);
  return Number.isSafeInteger(timestamp) ? Math.max(latest, timestamp) : latest;
}, 0);
const timestamp = Math.max(Date.now(), latestMigrationTimestamp + 1);
const args = providedName
  ? [
      typeormCli,
      'migration:create',
      resolve(migrationsDirectory, providedName),
      '--timestamp',
      String(timestamp),
    ]
  : [
      typeormCli,
      'migration:generate',
      resolve(migrationsDirectory, 'AutoMigration'),
      '--dataSource',
      dataSource,
      '--pretty',
      '--timestamp',
      String(timestamp),
    ];
const result = spawnSync(executable, args, {
  cwd: apiRoot,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
