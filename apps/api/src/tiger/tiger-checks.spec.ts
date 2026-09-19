import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readViewSourceDatabase } from './tiger-checks.js';

void test('reads the source database of a cross-database view', () => {
  // The live views were written without brackets; the migration writes them with brackets.
  assert.equal(readViewSourceDatabase('SELECT [NR] AS [nr] FROM Lorem.[dbo].[L_CAPIDIV]'), 'Lorem');
  assert.equal(
    readViewSourceDatabase('CREATE VIEW x AS SELECT 1\n  FROM [TIGERDB].[dbo].[LG_SLSMAN]'),
    'TIGERDB',
  );
  assert.equal(readViewSourceDatabase('SELECT 1 FROM [Odd]]Name].dbo.L_CAPIDIV'), 'Odd]Name');
});

void test('returns null when the view does not read another database', () => {
  assert.equal(readViewSourceDatabase('SELECT 1 FROM dbo.employees'), null);
  assert.equal(readViewSourceDatabase('SELECT 1'), null);
});
