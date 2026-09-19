import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EntityManager, EntityTarget } from 'typeorm';

import { runWithRequestContext } from '../common/request-context.js';
import { isAuditWrite } from './audit-write-scope.js';
import { AuditService } from './audit.service.js';
import type { AuditedEntity } from './audited-entity.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

interface Widget extends AuditedEntity {
  id: string;
  name: string;
  isActive: boolean;
  secret: string;
}

class WidgetEntity {}

const WIDGET = WidgetEntity as unknown as EntityTarget<Widget>;
const ACTOR = '11111111-1111-4111-8111-111111111111';
const REQUEST = '22222222-2222-4222-8222-222222222222';

function fakeColumn(propertyName: string, type = 'nvarchar', extra: object = {}) {
  return { propertyName, type, isPrimary: false, isSelect: true, ...extra };
}

const COLUMNS = [
  fakeColumn('id', 'uniqueidentifier', { isPrimary: true }),
  fakeColumn('name'),
  fakeColumn('isActive', 'bit'),
  fakeColumn('secret', 'nvarchar', { isSelect: false }),
  fakeColumn('createdAt', 'datetime2'),
  fakeColumn('createdBy', 'uniqueidentifier'),
  fakeColumn('updatedAt', 'datetime2'),
  fakeColumn('updatedBy', 'uniqueidentifier'),
];

const METADATA = {
  tableName: 'widgets',
  columns: COLUMNS,
  primaryColumns: COLUMNS.slice(0, 1),
  findColumnWithPropertyName: (name: string) => COLUMNS.find((c) => c.propertyName === name),
};

function fakeManager(storedRows: Array<Record<string, unknown>>) {
  const updates: Array<{ where: unknown; set: Record<string, unknown> }> = [];
  const inserts: Array<Record<string, unknown>> = [];
  const logs: Array<Record<string, unknown>> = [];
  let nextId = 1;

  const widgets = {
    metadata: METADATA,
    create: (values: object) => ({ ...values }),
    find: () => Promise.resolve(storedRows.map((row) => ({ ...row }))),
    update: (where: unknown, set: Record<string, unknown>) => {
      assert.equal(isAuditWrite(), true, 'writes run inside the audit scope');
      updates.push({ where, set });
      return Promise.resolve({ affected: 1 });
    },
    insert: (rows: Array<Record<string, unknown>>) => {
      assert.equal(isAuditWrite(), true, 'writes run inside the audit scope');
      for (const row of rows) {
        row.id = `NEW-${nextId++}`;
        inserts.push(row);
      }
      return Promise.resolve({});
    },
  };
  const auditLogs = {
    insert: (rows: Array<Record<string, unknown>>) => {
      logs.push(...rows);
      return Promise.resolve({});
    },
  };
  const manager = {
    queryRunner: { isTransactionActive: true },
    getRepository: (target: unknown) => (target === AuditLogEntity ? auditLogs : widgets),
  } as unknown as EntityManager;

  return { manager, updates, inserts, logs };
}

function asActor<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    { requestId: REQUEST, actorId: ACTOR, ipAddress: '10.0.0.7' },
    callback,
  );
}

void test('update writes and logs only the rows that change, stamped with the actor', async () => {
  const { manager, updates, logs } = fakeManager([
    { id: 'A', name: 'Widget A', isActive: true },
    { id: 'B', name: 'Widget B', isActive: false },
  ]);

  const result = await asActor(() =>
    new AuditService().update(
      manager,
      WIDGET,
      {},
      { isActive: false },
      { context: { via: 'bulk-status' } },
    ),
  );

  assert.deepEqual(result, { matched: 2, changedIds: ['A'] });
  assert.equal(updates.length, 1);
  assert.equal(updates[0]?.set.isActive, false);
  assert.equal(updates[0]?.set.updatedBy, ACTOR);
  assert.equal(typeof updates[0]?.set.updatedAt, 'function');
  assert.deepEqual(logs, [
    {
      action: 'update',
      changes: JSON.stringify({ isActive: { old: true, new: false } }),
      context: JSON.stringify({ via: 'bulk-status' }),
      createdBy: ACTOR,
      ipAddress: '10.0.0.7',
      recordId: 'A',
      requestId: REQUEST,
      tableName: 'widgets',
    },
  ]);
});

void test('nothing is written when no row changes', async () => {
  const { manager, updates, logs } = fakeManager([{ id: 'A', name: 'Widget A', isActive: false }]);

  const result = await new AuditService().update(manager, WIDGET, {}, { isActive: false });

  assert.deepEqual(result, { matched: 1, changedIds: [] });
  assert.equal(updates.length, 0);
  assert.equal(logs.length, 0);
});

void test('extra changes force a write and join the log entry', async () => {
  const { manager, updates, logs } = fakeManager([{ id: 'A', name: 'Widget A', isActive: true }]);
  const items = { old: [{ code: 'STORE_SALES' }], new: [{ code: 'STORE_RECEIPTS' }] };

  await new AuditService().update(
    manager,
    WIDGET,
    {},
    { name: 'Widget A' },
    { extraChanges: { items } },
  );

  assert.equal(updates.length, 1);
  assert.equal(logs[0]?.changes, JSON.stringify({ items }));
  assert.equal(logs[0]?.createdBy, null, 'no request context means a system write');
});

void test('log: false stamps the rows without writing log entries', async () => {
  const { manager, updates, logs } = fakeManager([{ id: 'A', name: 'Widget A', isActive: true }]);

  await asActor(() =>
    new AuditService().update(manager, WIDGET, {}, { secret: 'rotated' }, { log: false }),
  );

  assert.equal(updates[0]?.set.updatedBy, ACTOR);
  assert.equal(logs.length, 0);
});

void test('insert stamps both actors and logs the created values without secrets', async () => {
  const { manager, inserts, logs } = fakeManager([]);

  const widget = await asActor(() =>
    new AuditService().insert(manager, WIDGET, { name: 'New', isActive: true, secret: 'x' }),
  );

  assert.equal(widget.id, 'NEW-1');
  assert.equal(inserts[0]?.createdBy, ACTOR);
  assert.equal(inserts[0]?.updatedBy, ACTOR);
  assert.equal(logs[0]?.action, 'create');
  assert.equal(logs[0]?.recordId, 'NEW-1');
  assert.deepEqual(JSON.parse(String(logs[0]?.changes)), {
    name: { new: 'New' },
    isActive: { new: true },
    secret: { redacted: true },
  });
});

void test('audit columns and unknown keys cannot be written by callers', async () => {
  const { manager } = fakeManager([{ id: 'A', name: 'Widget A', isActive: true }]);
  const service = new AuditService();

  await assert.rejects(
    () => service.update(manager, WIDGET, {}, { createdBy: ACTOR } as never),
    /"createdBy" is not a writable column/,
  );
  await assert.rejects(
    () => service.insert(manager, WIDGET, { color: 'red' } as never),
    /"color" is not a writable column/,
  );
});
