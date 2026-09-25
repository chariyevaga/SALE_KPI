import assert from 'node:assert/strict';
import { test } from 'node:test';

import readXlsxFile, { readSheet } from 'read-excel-file/node';

import { parseImportSheet } from './visitor-count-import-rules.js';
import { buildVisitorCountTemplate } from './visitor-count-template.js';

const MERKEZ = { nr: 0, name: 'Merkez' };
const SUBE = { nr: 2, name: 'Şube' };

void test('the template reads back as the counts it was filled with', async () => {
  const file = await buildVisitorCountTemplate(
    [
      { date: '2026-09-21', store: MERKEZ, visitorCount: 184 },
      { date: '2026-09-21', store: SUBE, visitorCount: null },
      { date: '2026-09-22', store: MERKEZ, visitorCount: 0 },
    ],
    [MERKEZ, SUBE],
    'tr',
  );
  const parsed = parseImportSheet(await readSheet(file), new Date('2026-09-25T08:00:00Z'));

  assert.deepEqual(parsed.rows, [
    { row: 2, date: '2026-09-21', storeNr: 0, visitorCount: 184 },
    { row: 4, date: '2026-09-22', storeNr: 0, visitorCount: 0 },
  ]);
  assert.equal(parsed.skipped, 1);
  assert.deepEqual(parsed.errors, []);
});

void test('the template has the counts, the store list and the instructions', async () => {
  const sheets = await readXlsxFile(await buildVisitorCountTemplate([], [MERKEZ, SUBE], 'en'));

  assert.deepEqual(
    sheets.map((sheet) => sheet.sheet),
    ['Visitor counts', 'Stores', 'Instructions'],
  );
  assert.deepEqual(sheets[0]?.data[0], ['Date', 'Store no', 'Store', 'Visitor count']);
  assert.deepEqual(sheets[1]?.data.slice(1), [
    [0, 'Merkez'],
    [2, 'Şube'],
  ]);
});
