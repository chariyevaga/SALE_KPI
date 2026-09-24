import { resolve } from 'node:path';

const DEFAULT_API_PORT = 3000;
const DEFAULT_FILE_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const DEFAULT_FILE_STORAGE_ROOT = './var/uploads';
const DEFAULT_FILE_CLEANUP_TIME_ZONE = 'Asia/Ashgabat';
const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL = '30d';
const DEFAULT_SHORT_SESSION_TTL = '20m';
const DEFAULT_KPI_AUTO_CALCULATION_INTERVAL_MINUTES = 10;
/** One day; a longer pause is the same as switching the job off. */
const MAX_KPI_AUTO_CALCULATION_INTERVAL_MINUTES = 24 * 60;

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

function getBoundedIntegerEnvironmentVariable(
  name: string,
  defaultValue: number,
  max: number,
): number {
  const value = getIntegerEnvironmentVariable(name, defaultValue);

  if (value > max) {
    throw new Error(`${name} must be an integer between 1 and ${max}.`);
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

/**
 * Origins the browser may call the API from. In development (`NODE_ENV=development`) every
 * origin is allowed, so any local web port works without editing `CORS_ORIGINS`; the API
 * reads no cookies (tokens travel in the Authorization header), so this opens nothing a
 * page could abuse. Any other NODE_ENV, production included, uses the list.
 */
export function getCorsOrigin(): true | string[] {
  return process.env.NODE_ENV === 'development' ? true : getCorsOrigins();
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

/** Logo Tiger firm number: tables of firm 3 are `LG_003_…` (ADR-037). */
export function getFirmNumber(): number {
  return getBoundedIntegerEnvironmentVariable('FIRM_NR', 1, 999);
}

/** Logo Tiger period of that firm: period 1 of firm 3 is `LG_003_01_…` (ADR-037). */
export function getTigerPeriodNumber(): number {
  return getBoundedIntegerEnvironmentVariable('TIGER_PERIOD_NR', 1, 99);
}

/**
 * Every Logo period the KPI views read, oldest first (ADR-054): `TIGER_PERIOD_NRS=1,2` when a
 * new fiscal period was opened, so customers of the earlier period are not "new" again.
 * Without it, only TIGER_PERIOD_NR. TIGER_PERIOD_NR itself must be one of them.
 */
export function getTigerPeriodNumbers(): number[] {
  const raw = process.env.TIGER_PERIOD_NRS?.trim();
  const current = getTigerPeriodNumber();

  if (!raw) {
    return [current];
  }

  const periods = raw.split(',').map((part) => Number(part.trim()));

  if (periods.some((period) => !Number.isInteger(period) || period < 1 || period > 99)) {
    throw new Error(
      'TIGER_PERIOD_NRS must be a comma-separated list of integers between 1 and 99.',
    );
  }

  const unique = [...new Set(periods)].sort((left, right) => left - right);

  if (!unique.includes(current)) {
    throw new Error(`TIGER_PERIOD_NRS must include TIGER_PERIOD_NR (${current}).`);
  }

  return unique;
}

/** Tiger's `LG_xxx_CLCARD.CODE` is varchar(17). */
const MAX_TIGER_CUSTOMER_CODE_LENGTH = 17;

/**
 * Customer (CLCARD) codes of shared/anonymous cash accounts, comma-separated in
 * TIGER_SHARED_CUSTOMER_CODES. No customer KPI counts them (business decision 17).
 */
export function getTigerSharedCustomerCodes(): string[] {
  const codes = (process.env.TIGER_SHARED_CUSTOMER_CODES ?? '')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);

  for (const code of codes) {
    if (code.length > MAX_TIGER_CUSTOMER_CODE_LENGTH) {
      throw new Error(
        `TIGER_SHARED_CUSTOMER_CODES entries must be at most ${MAX_TIGER_CUSTOMER_CODE_LENGTH} characters ("${code}").`,
      );
    }
  }

  return [...new Set(codes)];
}

export function getFileStorageRoot(): string {
  return resolve(process.env.FILE_STORAGE_ROOT ?? DEFAULT_FILE_STORAGE_ROOT);
}

export function getFileMaxUploadBytes(): number {
  return getIntegerEnvironmentVariable('FILE_MAX_UPLOAD_BYTES', DEFAULT_FILE_MAX_UPLOAD_BYTES);
}

/**
 * The zone "today" is read in for business days (ADR-052): the conversion counts the days
 * before today there. Defaults to Asia/Ashgabat; the server itself runs in UTC.
 */
export function getBusinessTimeZone(): string {
  const timeZone = process.env.BUSINESS_TIME_ZONE?.trim() || DEFAULT_FILE_CLEANUP_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
  } catch {
    throw new Error('BUSINESS_TIME_ZONE must be a valid IANA time-zone name.');
  }

  return timeZone;
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

/**
 * Minutes between two automatic calculations of the open KPI periods; 0 switches the job
 * off (ADR-047). Every run reads each open month from Tiger once.
 */
export function getKpiAutoCalculationIntervalMinutes(): number {
  const name = 'KPI_AUTO_CALCULATION_INTERVAL_MINUTES';
  const value = Number(process.env[name] ?? DEFAULT_KPI_AUTO_CALCULATION_INTERVAL_MINUTES);

  if (!Number.isInteger(value) || value < 0 || value > MAX_KPI_AUTO_CALCULATION_INTERVAL_MINUTES) {
    throw new Error(
      `${name} must be an integer between 0 (off) and ${MAX_KPI_AUTO_CALCULATION_INTERVAL_MINUTES}.`,
    );
  }

  return value;
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
