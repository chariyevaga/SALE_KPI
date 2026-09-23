import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  TEMPLATE_NAME_MAX_LENGTH,
  copyNameBase,
  findTemplatesInUse,
  nextCopyName,
  sumWeights,
  templateItemKey,
} from './kpi-template-rules.js';

void test('sums weights without floating-point drift', () => {
  assert.equal(sumWeights([33.33, 33.33, 33.34]), 100);
  assert.equal(sumWeights([0.1, 0.2, 99.7]), 100);
  assert.equal(sumWeights([50, 20, 20, 10]), 100);
  assert.equal(sumWeights([60, 50]), 110);
  assert.equal(sumWeights([]), 0);
});

void test('item keys ignore GUID letter case but not input differences', () => {
  const upper = templateItemKey('2DE8BB69-A8B2-F111-9843-F4B52053B112', '{"storeIds":[2]}');
  const lower = templateItemKey('2de8bb69-a8b2-f111-9843-f4b52053b112', '{"storeIds":[2]}');
  const otherStore = templateItemKey('2de8bb69-a8b2-f111-9843-f4b52053b112', '{"storeIds":[4]}');

  assert.equal(upper, lower);
  assert.notEqual(lower, otherStore);
});

void test('copy names get the next free numeric suffix of the shared base name', () => {
  assert.equal(copyNameBase('MÜDÜR KPI 01 (3)'), 'MÜDÜR KPI 01');
  assert.equal(nextCopyName('MÜDÜR KPI 01', ['MÜDÜR KPI 01']), 'MÜDÜR KPI 01 (2)');
  assert.equal(
    nextCopyName('MÜDÜR KPI 01', ['MÜDÜR KPI 01', 'MÜDÜR KPI 01 (2)', 'MÜDÜR KPI 01 (5)']),
    'MÜDÜR KPI 01 (6)',
  );
  // Copying a copy continues the numbering of the original instead of nesting "(2) (2)".
  assert.equal(nextCopyName('MÜDÜR KPI 01 (2)', ['MÜDÜR KPI 01 (2)']), 'MÜDÜR KPI 01 (3)');
  // Names that only share a prefix do not count.
  assert.equal(nextCopyName('KPI', ['KPI (2)', 'KPI BAŞKA (9)']), 'KPI (3)');
  // The unique index is case-insensitive, so differently cased copies are taken numbers.
  assert.equal(nextCopyName('MÜDÜR KPI 01', ['müdür kpi 01 (4)']), 'MÜDÜR KPI 01 (5)');
});

void test('copy names stay within the column length', () => {
  const longName = 'A'.repeat(TEMPLATE_NAME_MAX_LENGTH);
  const copyName = nextCopyName(longName, [longName]);

  assert.equal(copyName.length, TEMPLATE_NAME_MAX_LENGTH);
  assert.ok(copyName.endsWith(' (2)'));
});

void test('lists only the templates a KPI plan was built from', () => {
  const templates = [
    { id: 'AAA', name: 'MÜDÜR KPI 01' },
    { id: 'BBB', name: 'SATIŞ KPI' },
    { id: 'CCC', name: 'Taslak' },
  ];
  const usage = [
    { templateId: 'aaa', planCount: 3 },
    { templateId: 'ccc', planCount: 0 },
  ];

  assert.deepEqual(findTemplatesInUse(templates, usage), [
    { id: 'AAA', name: 'MÜDÜR KPI 01', planCount: 3 },
  ]);
  assert.deepEqual(findTemplatesInUse(templates, []), []);
});

void test('counts plans whatever the GUID letter case is', () => {
  const inUse = findTemplatesInUse(
    [{ id: 'a791de4b-49af', name: 'KPI' }],
    [{ templateId: 'A791DE4B-49AF', planCount: 1 }],
  );

  assert.deepEqual(inUse, [{ id: 'a791de4b-49af', name: 'KPI', planCount: 1 }]);
});
