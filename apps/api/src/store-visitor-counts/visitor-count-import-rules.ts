import { MAX_VISITOR_COUNT, isFutureVisitDate } from './store-visitor-count-rules.js';

/**
 * Excel import of daily visitor counts (ADR-055). The sheet is read by column position, so
 * the header row may be in any language: A date, B store number (Tiger iş yeri no), C store
 * name (information only, ignored), D visitor count. Row 1 is the header.
 */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5_000;
/** The template covers at most this many days (a month plus a margin). */
export const MAX_TEMPLATE_DAYS = 62;
/** Row errors listed in one answer; the total is always given. */
export const MAX_REPORTED_ROW_ERRORS = 100;

export const IMPORT_ROW_ERROR_CODES = [
  'INVALID_DATE',
  'FUTURE_DATE',
  'INVALID_STORE',
  'UNKNOWN_STORE',
  'INVALID_COUNT',
  'DUPLICATE',
  'CLOSED_PERIOD',
] as const;

export type ImportRowErrorCode = (typeof IMPORT_ROW_ERROR_CODES)[number];

export type ImportCell = string | number | boolean | Date | null | undefined;

export interface ImportRowError {
  /** The Excel row number, as the user sees it (the header is row 1). */
  row: number;
  code: ImportRowErrorCode;
}

export interface ParsedImportRow {
  row: number;
  date: string;
  storeNr: number;
  visitorCount: number;
}

export interface ParsedImport {
  rows: ParsedImportRow[];
  errors: ImportRowError[];
  /** Rows with a date and store but no count: left as they are. */
  skipped: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Excel's day 0 (serial dates count days from 1899-12-30). */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DAY_FIRST_DATE = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
const DIGITS = /^\d+$/;

/** A cell as read-excel-file gives it; anything unexpected counts as empty. */
function toCell(value: unknown): ImportCell {
  return value instanceof Date ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? value
    : null;
}

function isBlank(cell: ImportCell): boolean {
  return cell === null || cell === undefined || (typeof cell === 'string' && cell.trim() === '');
}

function isoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  // Rejects 31.02 and the like, which Date.UTC would roll into the next month.
  if (
    year < 2000 ||
    year > 2100 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

/**
 * A date cell as `YYYY-MM-DD`: an Excel date (read as a UTC midnight), an Excel serial
 * number, `YYYY-MM-DD` text or day-first text (`25.09.2026`, `25/09/2026`).
 */
export function parseImportDate(cell: ImportCell): string | null {
  if (cell instanceof Date) {
    return Number.isNaN(cell.getTime())
      ? null
      : isoDate(cell.getUTCFullYear(), cell.getUTCMonth() + 1, cell.getUTCDate());
  }

  if (typeof cell === 'number') {
    const date = new Date(EXCEL_EPOCH + Math.floor(cell) * DAY_MS);

    return Number.isFinite(cell)
      ? isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
      : null;
  }

  if (typeof cell !== 'string') {
    return null;
  }

  const text = cell.trim();
  const iso = ISO_DATE.exec(text);

  if (iso) {
    return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const dayFirst = DAY_FIRST_DATE.exec(text);

  return dayFirst ? isoDate(Number(dayFirst[3]), Number(dayFirst[2]), Number(dayFirst[1])) : null;
}

/** A whole, non-negative number from a number cell or digits typed as text ("1 234" too). */
function parseWholeNumber(cell: ImportCell): number | null {
  if (typeof cell === 'number') {
    return Number.isInteger(cell) && cell >= 0 ? cell : null;
  }

  if (typeof cell === 'string') {
    const text = cell.replace(/[\s\u00a0]/g, '');

    return DIGITS.test(text) ? Number(text) : null;
  }

  return null;
}

export function parseImportCount(cell: ImportCell): number | null {
  const count = parseWholeNumber(cell);

  return count !== null && count <= MAX_VISITOR_COUNT ? count : null;
}

/**
 * Reads the sheet's rows into counts. Checks that need no database are done here (dates,
 * numbers, future days, the same store and day twice); the store and closed-month checks
 * are the service's. Every problem is reported with its row, so the whole file can be
 * fixed at once; nothing is written while any row is wrong.
 */
export function parseImportSheet(data: readonly (readonly unknown[])[], now: Date): ParsedImport {
  const rows: ParsedImportRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  data.forEach((cells, index) => {
    const row = index + 1;
    const [dateCell, storeCell, , countCell] = [0, 1, 2, 3].map((column) => toCell(cells[column]));

    if (row === 1 || (isBlank(dateCell) && isBlank(storeCell) && isBlank(countCell))) {
      return;
    }

    if (isBlank(countCell)) {
      skipped += 1;
      return;
    }

    const date = parseImportDate(dateCell);
    const storeNr = parseWholeNumber(storeCell);
    const visitorCount = parseImportCount(countCell);

    if (date === null) {
      errors.push({ row, code: 'INVALID_DATE' });
    } else if (isFutureVisitDate(date, now)) {
      errors.push({ row, code: 'FUTURE_DATE' });
    } else if (storeNr === null) {
      errors.push({ row, code: 'INVALID_STORE' });
    } else if (visitorCount === null) {
      errors.push({ row, code: 'INVALID_COUNT' });
    } else {
      const key = `${String(storeNr)}|${date}`;

      if (seen.has(key)) {
        errors.push({ row, code: 'DUPLICATE' });
      } else {
        seen.add(key);
        rows.push({ row, date, storeNr, visitorCount });
      }
    }
  });

  return { rows, errors, skipped };
}

/** Every day from `from` to `to`, both included, as `YYYY-MM-DD`. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];

  for (
    let time = Date.parse(`${from}T00:00:00Z`);
    time <= Date.parse(`${to}T00:00:00Z`);
    time += DAY_MS
  ) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }

  return days;
}

/** The day before `date` (`YYYY-MM-DD`). */
export function previousDay(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}
