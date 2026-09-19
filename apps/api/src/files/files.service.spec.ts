import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { DataSource, EntityManager, Repository } from 'typeorm';

import type { AuditService } from '../audit/audit.service.js';
import { FileEntity } from './entities/file.entity.js';
import type { FileSourceReferenceRegistry } from './file-source-reference.registry.js';
import type { FileStorageService } from './file-storage.service.js';
import { FilesService } from './files.service.js';

void test('creates an upload as an unowned file through the audit trail', async () => {
  let createdFile: FileEntity | undefined;
  const repository = {
    create: (input: Partial<FileEntity>) => Object.assign(new FileEntity(), input),
  } as unknown as Repository<FileEntity>;
  const audit = {
    insert: (_manager: EntityManager, _target: unknown, values: Partial<FileEntity>) => {
      createdFile = Object.assign(new FileEntity(), values, {
        id: '15ff673d-8d61-4aa7-817a-cd41e7a71c31',
        createdAt: new Date('2026-09-11T08:00:00.000Z'),
      });
      return Promise.resolve(createdFile);
    },
  } as unknown as AuditService;
  const storage = {
    storeImage: () =>
      Promise.resolve({
        fileName: 'original.webp',
        bigImage: 'big.webp',
        mediumImage: 'medium.webp',
        smallImage: 'small.webp',
        blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
        mimeType: 'image/webp',
      }),
  } as unknown as FileStorageService;
  const service = new FilesService(
    repository,
    { manager: {} } as DataSource,
    storage,
    {} as FileSourceReferenceRegistry,
    audit,
  );

  const response = await service.create({
    originalname: 'avatar.jpg',
    mimetype: 'image/jpeg',
    size: 4,
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
  } as Express.Multer.File);

  assert.equal(createdFile?.sourceTable, null);
  assert.equal(createdFile?.sourceField, null);
  assert.equal(createdFile?.sourceTableId, null);
  assert.equal(response.id, '15ff673d-8d61-4aa7-817a-cd41e7a71c31');
});

void test('clears the owner reference before orphaning a file', async () => {
  const events: string[] = [];
  const file = Object.assign(new FileEntity(), {
    id: '15ff673d-8d61-4aa7-817a-cd41e7a71c31',
    sourceTable: 'employees',
    sourceField: 'avatar_id',
    sourceTableId: 'employee-1',
  });
  const queryBuilder = {
    setLock: () => queryBuilder,
    where: () => queryBuilder,
    getOne: () => Promise.resolve(file),
  };
  const manager = {
    getRepository: () => ({ createQueryBuilder: () => queryBuilder }),
  } as unknown as EntityManager;
  const audit = {
    update: (_manager: EntityManager, _target: unknown, _where: unknown, patch: object) => {
      events.push('file-orphaned');
      assert.deepEqual(patch, { sourceTable: null, sourceField: null, sourceTableId: null });
      return Promise.resolve({ matched: 1, changedIds: [file.id] });
    },
  } as unknown as AuditService;
  const dataSource = {
    transaction: async (operation: (entityManager: EntityManager) => Promise<void>) =>
      operation(manager),
  } as unknown as DataSource;
  const sourceReferences = {
    clearReference: () => {
      events.push('owner-reference-cleared');
      return Promise.resolve();
    },
  } as unknown as FileSourceReferenceRegistry;
  const service = new FilesService(
    {} as Repository<FileEntity>,
    dataSource,
    { move: () => Promise.resolve() } as unknown as FileStorageService,
    sourceReferences,
    audit,
  );

  await service.requestDeletion(file.id);

  assert.deepEqual(events, ['owner-reference-cleared', 'file-orphaned']);
  assert.equal(file.sourceTable, null);
  assert.equal(file.sourceField, null);
  assert.equal(file.sourceTableId, null);
});

void test('physically deletes an orphan before removing its database row', async () => {
  const events: string[] = [];
  const file = Object.assign(new FileEntity(), {
    id: '15ff673d-8d61-4aa7-817a-cd41e7a71c31',
    fileName: 'stored-file.webp',
    bigImage: null,
    mediumImage: null,
    smallImage: null,
    sourceTableId: null,
  });
  const queryBuilder = {
    setLock: () => queryBuilder,
    where: () => queryBuilder,
    andWhere: () => queryBuilder,
    getOne: () => Promise.resolve(file),
  };
  const manager = {
    getRepository: () => ({ createQueryBuilder: () => queryBuilder }),
  } as unknown as EntityManager;
  const audit = {
    delete: () => {
      events.push('row-deleted');
      return Promise.resolve(1);
    },
  } as unknown as AuditService;
  const dataSource = {
    transaction: async (operation: (entityManager: EntityManager) => Promise<boolean>) =>
      operation(manager),
  } as unknown as DataSource;
  const storage = {
    delete: () => {
      events.push('physical-file-deleted');
      return Promise.resolve();
    },
  } as unknown as FileStorageService;
  const service = new FilesService(
    {} as Repository<FileEntity>,
    dataSource,
    storage,
    {} as FileSourceReferenceRegistry,
    audit,
  );

  assert.equal(await service.purgeOrphan(file.id), true);
  assert.deepEqual(events, ['physical-file-deleted', 'row-deleted']);
});
