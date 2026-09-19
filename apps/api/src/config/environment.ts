import { resolve } from 'node:path';

const DEFAULT_API_PORT = 3000;
const DEFAULT_FILE_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const DEFAULT_FILE_STORAGE_ROOT = './var/uploads';
const DEFAULT_FILE_CLEANUP_TIME_ZONE = 'Asia/Ashgabat';
const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL = '30d';
const DEFAULT_SHORT_SESSION_TTL = '20m';

function getRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getIntegerEnvironmentVariable(name: string, defaultValue: number): number {
  const value = Number(process.env[name] ?? defaultValue);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

function getBooleanEnvironmentVariable(name: string, defaultValue: boolean): boolean {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return defaultValue;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`${name} must be either true or false.`);
}

export function getApiPort(): number {
  const configuredPort = Number(process.env.API_PORT ?? DEFAULT_API_PORT);

  if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65_535) {
    throw new Error('API_PORT must be an integer between 1 and 65535.');
  }

  return configuredPort;
}

export function getCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export interface KpiDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export type TigerDatabaseConfig = KpiDatabaseConfig;

export function getKpiDatabaseConfig(): KpiDatabaseConfig {
  const port = getIntegerEnvironmentVariable('KPI_DB_PORT', 1433);

  if (port > 65_535) {
    throw new Error('KPI_DB_PORT must be an integer between 1 and 65535.');
  }

  return {
    host: getRequiredEnvironmentVariable('KPI_DB_HOST'),
    port,
    database: getRequiredEnvironmentVariable('KPI_DB_NAME'),
    username: getRequiredEnvironmentVariable('KPI_DB_USER'),
    password: getRequiredEnvironmentVariable('KPI_DB_PASSWORD'),
    encrypt: getBooleanEnvironmentVariable('KPI_DB_ENCRYPT', false),
    trustServerCertificate: getBooleanEnvironmentVariable('KPI_DB_TRUST_SERVER_CERTIFICATE', true),
  };
}

export function getTigerDatabaseConfig(): TigerDatabaseConfig {
  const port = getIntegerEnvironmentVariable('TIGER_DB_PORT', 1433);

  if (port > 65_535) {
    throw new Error('TIGER_DB_PORT must be an integer between 1 and 65535.');
  }

  return {
    host: getRequiredEnvironmentVariable('TIGER_DB_HOST'),
    port,
    database: getRequiredEnvironmentVariable('TIGER_DB_NAME'),
    username: getRequiredEnvironmentVariable('TIGER_DB_USER'),
    password: getRequiredEnvironmentVariable('TIGER_DB_PASSWORD'),
    encrypt: getBooleanEnvironmentVariable('TIGER_DB_ENCRYPT', false),
    trustServerCertificate: getBooleanEnvironmentVariable(
      'TIGER_DB_TRUST_SERVER_CERTIFICATE',
      true,
    ),
  };
}

export function getFirmNumber(): number {
  return getIntegerEnvironmentVariable('FIRM_NR', 1);
}

export function getFileStorageRoot(): string {
  return resolve(process.env.FILE_STORAGE_ROOT ?? DEFAULT_FILE_STORAGE_ROOT);
}

export function getFileMaxUploadBytes(): number {
  return getIntegerEnvironmentVariable('FILE_MAX_UPLOAD_BYTES', DEFAULT_FILE_MAX_UPLOAD_BYTES);
}

export function getFileCleanupTimeZone(): string {
  const timeZone = process.env.FILE_CLEANUP_TIME_ZONE?.trim() || DEFAULT_FILE_CLEANUP_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    throw new Error('FILE_CLEANUP_TIME_ZONE must be a valid IANA time-zone name.');
  }

  return timeZone;
}

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  shortSessionTtlSeconds: number;
}

function parseTokenTtl(name: string, value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

  if (!match) {
    throw new Error(`${name} must use a duration such as 15m, 12h, or 30d.`);
  }

  const amount = Number(match[1]);
  const multiplier = { s: 1, m: 60, h: 3_600, d: 86_400 }[match[2] as 's' | 'm' | 'h' | 'd'];
  const seconds = amount * multiplier;

  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    throw new Error(`${name} must be a positive duration.`);
  }

  return seconds;
}

export function getTokenConfig(): TokenConfig {
  const accessSecret = getRequiredEnvironmentVariable('ACCESS_TOKEN_SECRET');
  const refreshSecret = getRequiredEnvironmentVariable('REFRESH_TOKEN_SECRET');

  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be at least 32 characters.');
  }

  if (accessSecret === refreshSecret) {
    throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different.');
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtlSeconds: parseTokenTtl(
      'ACCESS_TOKEN_TTL',
      process.env.ACCESS_TOKEN_TTL ?? DEFAULT_ACCESS_TOKEN_TTL,
    ),
    refreshTtlSeconds: parseTokenTtl(
      'REFRESH_TOKEN_TTL',
      process.env.REFRESH_TOKEN_TTL ?? DEFAULT_REFRESH_TOKEN_TTL,
    ),
    shortSessionTtlSeconds: parseTokenTtl(
      'SHORT_SESSION_TTL',
      process.env.SHORT_SESSION_TTL ?? DEFAULT_SHORT_SESSION_TTL,
    ),
  };
}
