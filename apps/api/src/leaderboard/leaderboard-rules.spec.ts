import assert from 'node:assert/strict';
import { test } from 'node:test';

import { rankEntries } from './leaderboard-rules.js';

function entry(firstname: string, totalScore: number | null) {
  return { employee: { firstname, lastname: 'X' }, totalScore };
}

void test('ranks by score, highest first; ties share a rank and the next one skips', () => {
  const ranked = rankEntries([
    entry('Ayna', 70),
    entry('Batyr', 92.5),
    entry('Merdan', 70),
    entry('Jeren', 55),
  ]);

  assert.deepEqual(
    ranked.map(({ employee, rank }) => [employee.firstname, rank]),
    [
      ['Batyr', 1],
      ['Ayna', 2],
      ['Merdan', 2],
      ['Jeren', 4],
    ],
  );
});

void test('plans without a score have no rank and come last', () => {
  const ranked = rankEntries([entry('Ayna', null), entry('Batyr', 0), entry('Aman', null)]);

  assert.deepEqual(
    ranked.map(({ employee, rank }) => [employee.firstname, rank]),
    [
      ['Batyr', 1],
      ['Aman', null],
      ['Ayna', null],
    ],
  );
});
