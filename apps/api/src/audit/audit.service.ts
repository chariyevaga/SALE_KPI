import { Injectable } from '@nestjs/common';
import {
  In,
  type DeepPartial,
  type EntityManager,
  type EntityMetadata,
  type EntityTarget,
  type FindOptionsSelect,
  type FindOptionsWhere,
} from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

import { getRequestContext } from '../common/request-context.js';
import {
  diffRow,
  snapshotChanges,
  type AuditAction,
  type AuditChanges,
  type AuditColumn,
  type AuditValue,
} from './audit-changes.js';
import { UNLOGGED_COLUMNS, isAuditedMetadata } from './audit-rules.js';
import { runAuditWrite } from './audit-write-scope.js';
import { AUDIT_COLUMN_KEYS, type AuditColumnKey, type AuditedEntity } from './audited-entity.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

/** Column values a caller may write; the audit columns belong to AuditService. */
export type AuditValues<Entity extends AuditedEntity> = Partial<Omit<Entity, AuditColumnKey>>;

export interface AuditWriteOptions {
  /** Merged into each log entry, e.g. `{ items: { old, new } }` for a template's KPI rows. */
  extraChanges?: AuditChanges;
  /** Stored in audit_logs.context, e.g. `{ via: 'bulk-status' }`. */
  context?: Record<string, AuditValue>;
  /**
   * false stamps and writes the rows without log entries. Allowed only for aggregate
   * children whose parent entry records them (template items) and for high-frequency
   * technical writes (refresh token rotation) — see ADR-036.
   */
  log?: boolean;
}

export interface AuditUpdateResult {
  /** Rows the criteria matched, changed or not. */
  matched: number;
  /** Rows actually written and logged, as stored (upper-case GUIDs). */
  changedIds: string[];
}

interface LogEntry {
  recordId: string;
  action: AuditAction;
  changes: AuditChanges;
  context: Record<string, AuditValue> | undefined;
}

/** SQL Server accepts at most 2,100 parameters per statement. */
const MAX_PARAMETERS = 2_000;
const MAX_IDS_PER_STATEMENT = 1_000;
const LOG_PARAMETERS_PER_ROW = 8;

/**
 * The only way to write audited tables (ADR-036). Every write stamps `created_*` /
 * `updated_*` with the acting employee from the request context and records what changed
 * in audit_logs, in the same transaction. Writes elsewhere are rejected by
 * AuditGuardSubscriber.
 */
@Injectable()
export class AuditService {
  async insert<Entity extends AuditedEntity>(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    values: AuditValues<Entity>,
    options: AuditWriteOptions = {},
  ): Promise<Entity> {
    const [entity] = await this.insertRows(manager, target, [values], options);

    if (!entity) {
      throw new Error('Insert returned no row.');
    }

    return entity;
  }

  insertMany<Entity extends AuditedEntity>(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    rows: readonly AuditValues<Entity>[],
    options: AuditWriteOptions = {},
  ): Promise<Entity[]> {
    return this.insertRows(manager, target, rows, options);
  }

  /**
   * Writes `patch` to the matching rows whose values actually differ and logs each of
   * them. Rows already holding the values are left untouched and are not counted.
   */
  update<Entity extends AuditedEntity>(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    where: FindOptionsWhere<Entity>,
    patch: AuditValues<Entity>,
    options: AuditWriteOptions = {},
  ): Promise<AuditUpdateResult> {
    return this.write(manager, async (transaction) => {
      const repository = transaction.getRepository(target);
      const metadata = repository.metadata;
      const values = definedValues(patch);
      const columns = pickColumns(metadata, Object.keys(values));
      const select = Object.fromEntries([
        ['id', true],
        ...columns
          .filter((column) => !column.isRedacted)
          .map((column) => [column.propertyName, true]),
      ]) as FindOptionsSelect<Entity>;
      const rows = await repository.find({
        select,
        where,
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      const extraChanges = options.extraChanges ?? {};
      const hasExtraChanges = Object.keys(extraChanges).length > 0;
      const changedIds: string[] = [];
      const entries: LogEntry[] = [];

      for (const row of rows) {
        const diff = diffRow(columns, row as Record<string, unknown>, values);

        if (!diff.changed && !hasExtraChanges) {
          continue;
        }

        const recordId = readId(metadata, row);
        const changes = { ...diff.changes, ...extraChanges };
        changedIds.push(recordId);

        if (Object.keys(changes).length > 0) {
          entries.push({ recordId, action: 'update', changes, context: options.context });
        }
      }

      if (changedIds.length === 0) {
        return { matched: rows.length, changedIds };
      }

      const set = {
        ...values,
        updatedBy: currentActorId(),
        // TypeORM would write CURRENT_TIMESTAMP, which is the server's local time.
        updatedAt: () => 'SYSUTCDATETIME()',
      } as QueryDeepPartialEntity<Entity>;

      for (const ids of chunk(changedIds, MAX_IDS_PER_STATEMENT)) {
        await repository.update(whereIdIn<Entity>(ids), set);
      }

      if (options.log !== false) {
        await this.writeLogs(transaction, metadata, entries);
      }

      return { matched: rows.length, changedIds };
    });
  }

  /** Deletes the matching rows; each one is logged with its last values. */
  delete<Entity extends AuditedEntity>(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    where: FindOptionsWhere<Entity>,
    options: AuditWriteOptions = {},
  ): Promise<number> {
    return this.write(manager, async (transaction) => {
      const repository = transaction.getRepository(target);
      const metadata = repository.metadata;
      assertAudited(metadata);

      if (options.log === false) {
        const result = await repository.delete(where);
        return result.affected ?? 0;
      }

      const rows = await repository.find({
        where,
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });

      if (rows.length === 0) {
        return 0;
      }

      const ids = rows.map((row) => readId(metadata, row));

      for (const batch of chunk(ids, MAX_IDS_PER_STATEMENT)) {
        await repository.delete(whereIdIn<Entity>(batch));
      }

      const columns = describeColumns(metadata);
      await this.writeLogs(
        transaction,
        metadata,
        rows.map((row, index) => ({
          recordId: ids[index] ?? '',
          action: 'delete',
          changes: snapshotChanges(columns, row as Record<string, unknown>, 'old'),
          context: options.context,
        })),
      );

      return rows.length;
    });
  }

  private insertRows<Entity extends AuditedEntity>(
    manager: EntityManager,
    target: EntityTarget<Entity>,
    rows: readonly AuditValues<Entity>[],
    options: AuditWriteOptions,
  ): Promise<Entity[]> {
    if (rows.length === 0) {
      return Promise.resolve([]);
    }

    return this.write(manager, async (transaction) => {
      const repository = transaction.getRepository(target);
      const metadata = repository.metadata;
      const values = rows.map((row) => definedValues(row));
      const columns = pickColumns(
        metadata,
        values.flatMap((row) => Object.keys(row)).filter((key) => key !== 'id'),
      );
      const actorId = currentActorId();
      const entities = values.map((row) =>
        repository.create({
          ...row,
          createdBy: actorId,
          updatedBy: actorId,
        } as DeepPartial<Entity>),
      );
      const rowsPerInsert = Math.max(1, Math.floor(MAX_PARAMETERS / (columns.length + 3)));

      // insert() fills generated values (id, created_at, updated_at) back into the entities.
      for (const batch of chunk(entities, rowsPerInsert)) {
        await repository.insert(batch as QueryDeepPartialEntity<Entity>[]);
      }

      if (options.log !== false) {
        await this.writeLogs(
          transaction,
          metadata,
          entities.map((entity, index) => ({
            recordId: readId(metadata, entity),
            action: 'create',
            changes: {
              ...snapshotChanges(columns, values[index] ?? {}, 'new'),
              ...options.extraChanges,
            },
            context: options.context,
          })),
        );
      }

      return entities;
    });
  }

  /** Runs in the caller's transaction, or opens one so the row and its log commit together. */
  private write<T>(
    manager: EntityManager,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const run = (transaction: EntityManager) => runAuditWrite(() => work(transaction));

    return manager.queryRunner?.isTransactionActive ? run(manager) : manager.transaction(run);
  }

  private async writeLogs(
    manager: EntityManager,
    metadata: EntityMetadata,
    entries: readonly LogEntry[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const request = getRequestContext();
    const rows = entries.map((entry) => ({
      action: entry.action,
      changes: JSON.stringify(entry.changes),
      context: entry.context ? JSON.stringify(entry.context) : null,
      createdBy: request?.actorId ?? null,
      ipAddress: request?.ipAddress?.slice(0, 45) ?? null,
      recordId: entry.recordId,
      requestId: request?.requestId ?? null,
      tableName: metadata.tableName,
    }));
    const repository = manager.getRepository(AuditLogEntity);

    for (const batch of chunk(rows, Math.floor(MAX_PARAMETERS / LOG_PARAMETERS_PER_ROW))) {
      await repository.insert(batch);
    }
  }
}

function currentActorId(): string | null {
  return getRequestContext()?.actorId ?? null;
}

function assertAudited(metadata: EntityMetadata): void {
  const primary = metadata.primaryColumns;

  if (!isAuditedMetadata(metadata)) {
    throw new Error(`dbo.${metadata.tableName} is not an audited table (extend AuditedEntity).`);
  }

  if (primary.length !== 1 || primary[0]?.propertyName !== 'id') {
    throw new Error(`dbo.${metadata.tableName} needs a single uniqueidentifier "id" primary key.`);
  }
}

/** Every writable column except the primary key and the audit columns. */
function describeColumns(metadata: EntityMetadata): AuditColumn[] {
  const unlogged = new Set(UNLOGGED_COLUMNS[metadata.tableName] ?? []);

  return metadata.columns
    .filter(
      (column) =>
        !column.isPrimary &&
        !(AUDIT_COLUMN_KEYS as readonly string[]).includes(column.propertyName),
    )
    .map((column) => ({
      propertyName: column.propertyName,
      isGuid: column.type === 'uniqueidentifier' || column.type === 'uuid',
      isRedacted: !column.isSelect,
      isLogged: !unlogged.has(column.propertyName),
    }));
}

/** Rejects unknown keys and the audit columns, which only AuditService may set. */
function pickColumns(metadata: EntityMetadata, keys: readonly string[]): AuditColumn[] {
  assertAudited(metadata);

  const columns = describeColumns(metadata);
  const byName = new Map(columns.map((column) => [column.propertyName, column]));
  const unique = [...new Set(keys)];

  for (const key of unique) {
    if (!byName.has(key)) {
      throw new Error(`"${key}" is not a writable column of dbo.${metadata.tableName}.`);
    }
  }

  return columns.filter((column) => unique.includes(column.propertyName));
}

function readId(metadata: EntityMetadata, row: object): string {
  const id = (row as { id?: unknown }).id;

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`dbo.${metadata.tableName} row has no id to log.`);
  }

  return id;
}

/** Audited tables all have an `id` primary key (checked by assertAudited). */
function whereIdIn<Entity>(ids: readonly string[]): FindOptionsWhere<Entity> {
  return { id: In([...ids]) } as unknown as FindOptionsWhere<Entity>;
}

function definedValues(values: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];

  for (let start = 0; start < items.length; start += size) {
    batches.push(items.slice(start, start + size));
  }

  return batches;
}
