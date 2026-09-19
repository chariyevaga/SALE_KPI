import type { EntityMetadata } from 'typeorm';

import { AUDIT_COLUMN_KEYS } from './audited-entity.js';

export const AUDIT_LOG_TABLE = 'audit_logs';

/**
 * Columns that are written and stamped as usual but left out of audit_logs.changes:
 * technical values that change on every login or token refresh. Keyed by table name,
 * listing entity property names (ADR-036).
 */
export const UNLOGGED_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  device_sessions: ['expiresAt', 'lastSeenAt', 'tokenFamilyId', 'tokenVersion'],
};

/** Audited tables are the ones whose entity extends AuditedEntity. */
export function isAuditedMetadata(metadata: EntityMetadata): boolean {
  return AUDIT_COLUMN_KEYS.every((key) => metadata.findColumnWithPropertyName(key) !== undefined);
}
