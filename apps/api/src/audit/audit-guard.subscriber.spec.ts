import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { EntityMetadata } from 'typeorm';

import { assertAuditedWrite } from './audit-guard.subscriber.js';
import { runAuditWrite } from './audit-write-scope.js';

function metadata(tableName: string, propertyNames: readonly string[]): EntityMetadata {
  return {
    tableName,
    findColumnWithPropertyName: (name: string) =>
      propertyNames.includes(name) ? { propertyName: name } : undefined,
  } as unknown as EntityMetadata;
}

const AUDITED = metadata('kpi_templates', [
  'id',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
]);
const LOGS = metadata('audit_logs', ['id', 'createdAt', 'createdBy']);
const OTHER = metadata('typeorm_migrations', ['id', 'name']);

void test('rejects direct writes to audited tables', () => {
  for (const operation of ['insert', 'update', 'delete']) {
    assert.throws(() => assertAuditedWrite(AUDITED, operation), /must go through AuditService/);
  }

  assert.throws(() => assertAuditedWrite(LOGS, 'insert'), /must go through AuditService/);
});

void test('lets AuditService write audited tables', async () => {
  await runAuditWrite(() => {
    assert.doesNotThrow(() => assertAuditedWrite(AUDITED, 'update'));
    assert.doesNotThrow(() => assertAuditedWrite(LOGS, 'insert'));
    return Promise.resolve();
  });
});

void test('audit_logs is append-only even for AuditService', async () => {
  await runAuditWrite(() => {
    assert.throws(() => assertAuditedWrite(LOGS, 'update'), /append-only/);
    assert.throws(() => assertAuditedWrite(LOGS, 'delete'), /append-only/);
    return Promise.resolve();
  });
});

void test('tables without the record trail columns are not guarded', () => {
  assert.doesNotThrow(() => assertAuditedWrite(OTHER, 'insert'));
});

void test('the write scope does not leak into later async work', async () => {
  await runAuditWrite(() => Promise.resolve());
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.throws(() => assertAuditedWrite(AUDITED, 'insert'), /must go through AuditService/);
});
