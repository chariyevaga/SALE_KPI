import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  diffRow,
  isSameValue,
  snapshotChanges,
  toAuditValue,
  type AuditColumn,
} from './audit-changes.js';

function column(propertyName: string, overrides: Partial<AuditColumn> = {}): AuditColumn {
  return { propertyName, isGuid: false, isRedacted: false, isLogged: true, ...overrides };
}

const COLUMNS = [
  column('firstname'),
  column('isActive'),
  column('avatarId', { isGuid: true }),
  column('weight'),
  column('revokedAt'),
  column('passwordHash', { isRedacted: true }),
  column('lastSeenAt', { isLogged: false }),
];

void test('turns column values into JSON-safe audit values', () => {
  assert.equal(toAuditValue(new Date('2026-09-19T08:00:00.000Z')), '2026-09-19T08:00:00.000Z');
  assert.equal(toAuditValue(undefined), null);
  assert.equal(toAuditValue(12n), '12');
  assert.deepEqual(toAuditValue({ storeIds: [2, 4], note: undefined }), { storeIds: [2, 4] });
});

void test('compares GUIDs without letter case, dates by instant and numbers by value', () => {
  const guid = column('id', { isGuid: true });
  const plain = column('value');

  assert.equal(
    isSameValue(
      guid,
      '5E1F2A3B-0000-4000-8000-00000000000A',
      '5e1f2a3b-0000-4000-8000-00000000000a',
    ),
    true,
  );
  assert.equal(isSameValue(plain, 'ABC', 'abc'), false);
  assert.equal(
    isSameValue(plain, new Date('2026-09-19T08:00:00.000Z'), '2026-09-19T08:00:00.000Z'),
    true,
  );
  assert.equal(isSameValue(plain, 33.3, '33.30'), true);
  assert.equal(isSameValue(plain, null, undefined), true);
  assert.equal(isSameValue(plain, null, ''), false);
});

void test('logs only the columns that really change', () => {
  const diff = diffRow(
    COLUMNS,
    { firstname: 'Ayşe', isActive: true, avatarId: 'AAAA-1', weight: 50, revokedAt: null },
    { firstname: 'Ayşegül', isActive: true, avatarId: 'aaaa-1', weight: 50, revokedAt: undefined },
  );

  assert.equal(diff.changed, true);
  assert.deepEqual(diff.changes, { firstname: { old: 'Ayşe', new: 'Ayşegül' } });
});

void test('reports no change when every written value is already stored', () => {
  assert.deepEqual(diffRow(COLUMNS, { isActive: false }, { isActive: false }), {
    changed: false,
    changes: {},
  });
});

void test('secrets count as changed but only their redacted marker is logged', () => {
  assert.deepEqual(diffRow(COLUMNS, {}, { passwordHash: 'scrypt$new' }), {
    changed: true,
    changes: { passwordHash: { redacted: true } },
  });
});

void test('unlogged technical columns are written but left out of the log', () => {
  const previous = new Date('2026-09-19T08:00:00.000Z');
  const next = new Date('2026-09-19T08:15:00.000Z');

  assert.deepEqual(diffRow(COLUMNS, { lastSeenAt: previous }, { lastSeenAt: next }), {
    changed: true,
    changes: {},
  });
});

void test('snapshots skip empty and unlogged values and redact secrets', () => {
  const values = {
    firstname: 'Ayşe',
    avatarId: null,
    passwordHash: 'scrypt$hash',
    lastSeenAt: new Date(),
  };

  assert.deepEqual(snapshotChanges(COLUMNS, values, 'new'), {
    firstname: { new: 'Ayşe' },
    passwordHash: { redacted: true },
  });
  assert.deepEqual(snapshotChanges(COLUMNS, { isActive: false }, 'old'), {
    isActive: { old: false },
  });
});
