import assert from 'node:assert/strict';
import { test } from 'node:test';

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { BULK_MAX_IDS, BulkIdsDto, BulkStatusDto } from './bulk.dto.js';

const GUID_A = '5E1F2A3B-0000-4000-8000-00000000000A';
const GUID_B = '5e1f2a3b-0000-4000-8000-00000000000b';

function guid(index: number): string {
  return `00000000-0000-0000-0000-${index.toString(16).padStart(12, '0')}`;
}

/** Mirrors the global ValidationPipe (transform + whitelist + forbidNonWhitelisted). */
function validate<T extends object>(type: new () => T, body: unknown) {
  const dto = plainToInstance(type, body);
  const errors = validateSync(dto, { whitelist: true, forbidNonWhitelisted: true });

  return { dto, failed: errors.map((error) => error.property) };
}

void test('accepts GUIDs in any letter case and lower-cases them', () => {
  const { dto, failed } = validate(BulkIdsDto, { ids: [GUID_A, GUID_B] });

  assert.deepEqual(failed, []);
  assert.deepEqual(dto.ids, [GUID_A.toLowerCase(), GUID_B]);
});

void test('rejects duplicates that differ only in letter case', () => {
  assert.deepEqual(validate(BulkIdsDto, { ids: [GUID_A, GUID_A.toLowerCase()] }).failed, ['ids']);
});

void test('rejects an empty, oversized, non-array or non-GUID selection', () => {
  const tooMany = Array.from({ length: BULK_MAX_IDS + 1 }, (_, index) => guid(index));
  const exactlyMax = tooMany.slice(0, BULK_MAX_IDS);

  assert.deepEqual(validate(BulkIdsDto, { ids: [] }).failed, ['ids']);
  assert.deepEqual(validate(BulkIdsDto, { ids: tooMany }).failed, ['ids']);
  assert.deepEqual(validate(BulkIdsDto, { ids: exactlyMax }).failed, []);
  assert.deepEqual(validate(BulkIdsDto, { ids: GUID_A }).failed, ['ids']);
  assert.deepEqual(validate(BulkIdsDto, { ids: ['not-a-guid'] }).failed, ['ids']);
  assert.deepEqual(validate(BulkIdsDto, {}).failed, ['ids']);
});

void test('status updates need an explicit boolean', () => {
  assert.deepEqual(validate(BulkStatusDto, { ids: [GUID_A], isActive: false }).failed, []);
  assert.deepEqual(validate(BulkStatusDto, { ids: [GUID_A] }).failed, ['isActive']);
  assert.deepEqual(validate(BulkStatusDto, { ids: [GUID_A], isActive: 'false' }).failed, [
    'isActive',
  ]);
});

void test('unknown fields are rejected', () => {
  assert.deepEqual(validate(BulkIdsDto, { ids: [GUID_A], isActive: true }).failed, ['isActive']);
});
