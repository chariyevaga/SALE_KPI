import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { FileEntity } from './entities/file.entity.js';
import { FileSourceReferenceRegistry } from './file-source-reference.registry.js';

function createAttachedFile(): FileEntity {
  return Object.assign(new FileEntity(), {
    id: '15ff673d-8d61-4aa7-817a-cd41e7a71c31',
    sourceTable: 'employees',
    sourceField: 'avatar_id',
    sourceTableId: 'employee-1',
  });
}

void test('delegates source cleanup to the registered table and field handler', async () => {
  const registry = new FileSourceReferenceRegistry();
  let call: { sourceTableId: string; fileId: string } | undefined;

  registry.register({
    sourceTable: 'employees',
    sourceField: 'avatar_id',
    clearReference(_manager, sourceTableId, fileId) {
      call = { sourceTableId, fileId };
      return Promise.resolve();
    },
  });

  await registry.clearReference({} as EntityManager, createAttachedFile());

  assert.deepEqual(call, {
    sourceTableId: 'employee-1',
    fileId: '15ff673d-8d61-4aa7-817a-cd41e7a71c31',
  });
});

void test('refuses to orphan an attached file when its source handler is missing', async () => {
  const registry = new FileSourceReferenceRegistry();

  await assert.rejects(
    registry.clearReference({} as EntityManager, createAttachedFile()),
    ConflictException,
  );
});

void test('rejects an attachment type that has no registered source handler', () => {
  const registry = new FileSourceReferenceRegistry();

  assert.throws(() => registry.assertRegistered('employees', 'avatar_id'), ConflictException);
});
