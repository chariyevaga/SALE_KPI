import {
  EventSubscriber,
  type EntityMetadata,
  type EntitySubscriberInterface,
  type InsertEvent,
  type RecoverEvent,
  type RemoveEvent,
  type SoftRemoveEvent,
  type UpdateEvent,
} from 'typeorm';

import { AUDIT_LOG_TABLE, isAuditedMetadata } from './audit-rules.js';
import { isAuditWrite } from './audit-write-scope.js';

/**
 * Makes the record trail impossible to skip by accident (ADR-036): every TypeORM write to
 * an audited table — save, insert, update, delete, through a repository, the manager or a
 * query builder — must run inside AuditService, and audit_logs only ever receives inserts.
 * Raw `query()` SQL does not raise these events; it is reserved for migrations.
 *
 * `@EventSubscriber()` is required: TypeORM silently drops undecorated classes listed in
 * the data source's `subscribers` option.
 */
@EventSubscriber()
export class AuditGuardSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<unknown>): void {
    assertAuditedWrite(event.metadata, 'insert');
  }

  beforeUpdate(event: UpdateEvent<unknown>): void {
    assertAuditedWrite(event.metadata, 'update');
  }

  beforeRemove(event: RemoveEvent<unknown>): void {
    assertAuditedWrite(event.metadata, 'delete');
  }

  beforeSoftRemove(event: SoftRemoveEvent<unknown>): void {
    assertAuditedWrite(event.metadata, 'soft delete');
  }

  beforeRecover(event: RecoverEvent<unknown>): void {
    assertAuditedWrite(event.metadata, 'recover');
  }
}

export function assertAuditedWrite(metadata: EntityMetadata, operation: string): void {
  if (metadata.tableName === AUDIT_LOG_TABLE) {
    if (operation !== 'insert') {
      throw new Error(`dbo.${AUDIT_LOG_TABLE} is append-only; ${operation} is not allowed.`);
    }
  } else if (!isAuditedMetadata(metadata)) {
    return;
  }

  if (!isAuditWrite()) {
    throw new Error(
      `Writes to dbo.${metadata.tableName} must go through AuditService (ADR-036); ` +
        `a direct ${operation} was attempted.`,
    );
  }
}
