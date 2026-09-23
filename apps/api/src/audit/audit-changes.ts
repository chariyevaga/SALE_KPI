/**
 * Pure helpers that turn column values into audit_logs.changes entries (ADR-036).
 * They know nothing about TypeORM; AuditService feeds them column facts from metadata.
 */

export const AUDIT_ACTIONS = ['create', 'update', 'delete'] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditValue =
  string | number | boolean | null | AuditValue[] | { [key: string]: AuditValue };

export interface AuditFieldChange {
  old?: AuditValue;
  new?: AuditValue;
  /** Secret column: only the fact that it was written is kept, never the value. */
  redacted?: true;
}

/** Keyed by entity property name (the API's camelCase field names). */
export type AuditChanges = Record<string, AuditFieldChange>;

/** What the diff needs to know about one column. */
export interface AuditColumn {
  propertyName: string;
  /** `uniqueidentifier`: compared without regard to letter case. */
  isGuid: boolean;
  /** `select: false` columns hold secrets (password and token hashes). */
  isRedacted: boolean;
  /** False for technical columns listed in UNLOGGED_COLUMNS. */
  isLogged: boolean;
}

export interface RowDiff {
  /** Some column differs, logged or not, so the row has to be written. */
  changed: boolean;
  /** The differences that go into the log entry. */
  changes: AuditChanges;
}

/** JSON-safe form of a column value; dates become ISO strings. */
export function toAuditValue(value: unknown): AuditValue {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toAuditValue(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, toAuditValue(item)]),
    );
  }

  return null;
}

export function isSameValue(column: AuditColumn, left: unknown, right: unknown): boolean {
  const before = left ?? null;
  const after = right ?? null;

  if (before === null || after === null) {
    return before === after;
  }

  if (before instanceof Date || after instanceof Date) {
    return toTime(before) === toTime(after);
  }

  if (column.isGuid && typeof before === 'string' && typeof after === 'string') {
    return before.toLowerCase() === after.toLowerCase();
  }

  if (typeof before === 'number' || typeof after === 'number') {
    return Number(before) === Number(after);
  }

  return JSON.stringify(toAuditValue(before)) === JSON.stringify(toAuditValue(after));
}

/**
 * Compares the stored row with the values about to be written. `undefined` in the patch
 * means "not written". Redacted columns always count as changed because their old value
 * is never loaded.
 */
export function diffRow(
  columns: readonly AuditColumn[],
  before: Readonly<Record<string, unknown>>,
  patch: Readonly<Record<string, unknown>>,
): RowDiff {
  let changed = false;
  const changes: AuditChanges = {};

  for (const column of columns) {
    const next = patch[column.propertyName];

    if (next === undefined) {
      continue;
    }

    if (column.isRedacted) {
      changed = true;

      if (column.isLogged) {
        changes[column.propertyName] = { redacted: true };
      }

      continue;
    }

    const previous = before[column.propertyName];

    if (isSameValue(column, previous, next)) {
      continue;
    }

    changed = true;

    if (column.isLogged) {
      changes[column.propertyName] = { old: toAuditValue(previous), new: toAuditValue(next) };
    }
  }

  return { changed, changes };
}

/** Values of a created (`new`) or deleted (`old`) row; empty values are left out. */
export function snapshotChanges(
  columns: readonly AuditColumn[],
  values: Readonly<Record<string, unknown>>,
  side: 'old' | 'new',
): AuditChanges {
  const changes: AuditChanges = {};

  for (const column of columns) {
    const value = values[column.propertyName];

    if (!column.isLogged || value === undefined || value === null) {
      continue;
    }

    changes[column.propertyName] = column.isRedacted
      ? { redacted: true }
      : { [side]: toAuditValue(value) };
  }

  return changes;
}

function toTime(value: unknown): number {
  return value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
}
