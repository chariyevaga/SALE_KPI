import type { AuditFieldChange, AuditLogEntry } from '../types/api';

function isNoop(change: AuditFieldChange): boolean {
  return (
    !change.redacted &&
    'old' in change &&
    'new' in change &&
    JSON.stringify(change.old) === JSON.stringify(change.new)
  );
}

function sameRequestUpdate(newer: AuditLogEntry, older: AuditLogEntry): boolean {
  return (
    newer.requestId !== null &&
    newer.requestId === older.requestId &&
    newer.action === 'update' &&
    older.action === 'update' &&
    newer.tableName === older.tableName &&
    newer.recordId.toLowerCase() === older.recordId.toLowerCase()
  );
}

/**
 * One request can write a record more than once — changing an avatar first releases the
 * old file, which clears the column, then saves the form. Adjacent updates of one record
 * from one request (entries arrive newest first) are shown as one entry: the oldest `old`
 * and the newest `new` of every field. Fields that end where they started are dropped.
 */
export function mergeRequestEntries(entries: readonly AuditLogEntry[]): AuditLogEntry[] {
  const merged: AuditLogEntry[] = [];

  for (const entry of entries) {
    const newer = merged[merged.length - 1];

    if (!newer || !sameRequestUpdate(newer, entry)) {
      merged.push(entry);
      continue;
    }

    const changes: Record<string, AuditFieldChange> = { ...entry.changes };

    for (const [field, change] of Object.entries(newer.changes)) {
      const older = changes[field];
      changes[field] = older && 'old' in older ? { ...change, old: older.old } : change;
    }

    merged[merged.length - 1] = {
      ...newer,
      changes: Object.fromEntries(Object.entries(changes).filter(([, change]) => !isNoop(change))),
      context: newer.context ?? entry.context,
    };
  }

  return merged.filter(
    (entry) => entry.action !== 'update' || Object.keys(entry.changes).length > 0,
  );
}
