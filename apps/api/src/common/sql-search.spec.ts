import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { SelectQueryBuilder } from 'typeorm';

import { andWhereEachSearchTerm, escapeLikePattern, splitSearchTerms } from './sql-search.js';

void test('escapes LIKE wildcards so they match literally', () => {
  assert.equal(escapeLikePattern('100%_[a]'), '100[%][_][[]a[]]');
  assert.equal(escapeLikePattern('Mağaza'), 'Mağaza');
});

void test('splits a search value into non-empty terms', () => {
  assert.deepEqual(splitSearchTerms('  mağaza   ciro '), ['mağaza', 'ciro']);
  assert.deepEqual(splitSearchTerms(''), []);
  assert.deepEqual(splitSearchTerms(undefined), []);
});

void test('adds one parameterized OR group per search term', () => {
  const calls: Array<{ where: string; parameters: Record<string, unknown> }> = [];
  const builder = {
    andWhere(where: string, parameters: Record<string, unknown>) {
      calls.push({ where, parameters });
      return this;
    },
  } as unknown as SelectQueryBuilder<{ id: number }>;

  andWhereEachSearchTerm(builder, 'ayşe 10%', [
    (parameter) => `store.name LIKE :${parameter}`,
    (parameter) => `store.nr LIKE :${parameter}`,
  ]);

  assert.deepEqual(calls, [
    {
      where: '(store.name LIKE :searchTerm0 OR store.nr LIKE :searchTerm0)',
      parameters: { searchTerm0: '%ayşe%' },
    },
    {
      where: '(store.name LIKE :searchTerm1 OR store.nr LIKE :searchTerm1)',
      parameters: { searchTerm1: '%10[%]%' },
    },
  ]);
});

void test('leaves the query untouched when the search is empty', () => {
  let called = false;
  const builder = {
    andWhere() {
      called = true;
      return this;
    },
  } as unknown as SelectQueryBuilder<{ id: number }>;

  andWhereEachSearchTerm(builder, '   ', [(parameter) => `x LIKE :${parameter}`]);

  assert.equal(called, false);
});
