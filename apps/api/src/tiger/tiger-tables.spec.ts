import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TigerTables } from './tiger-tables.js';

void test('builds firm and period table names with zero padding', () => {
  const tables = new TigerTables(3, 1);

  assert.equal(tables.firmTable('CLCARD'), '[LG_003_CLCARD]');
  assert.equal(tables.periodTable('INVOICE'), '[LG_003_01_INVOICE]');
  assert.equal(new TigerTables(125, 12).periodTable('STLINE'), '[LG_125_12_STLINE]');
});

void test('rejects firm and period numbers outside what Logo supports', () => {
  for (const [firm, period] of [
    [0, 1],
    [1000, 1],
    [3, 0],
    [3, 100],
    [3.5, 1],
    [Number.NaN, 1],
  ] as const) {
    assert.throws(() => new TigerTables(firm, period), /must be an integer/);
  }
});

void test('only accepts plain upper-case table suffixes', () => {
  const tables = new TigerTables(3, 1);

  for (const suffix of ['invoice', 'INVOICE]; DROP TABLE x;--', 'IN VOICE', '', '1INVOICE']) {
    assert.throws(() => tables.periodTable(suffix), /not a Logo table suffix/);
    assert.throws(() => tables.firmTable(suffix), /not a Logo table suffix/);
  }
});

void test('reads the firm and period from the environment', () => {
  const previous = { firm: process.env.FIRM_NR, period: process.env.TIGER_PERIOD_NR };

  try {
    process.env.FIRM_NR = '3';
    process.env.TIGER_PERIOD_NR = '1';
    assert.equal(TigerTables.fromEnvironment().periodTable('INVOICE'), '[LG_003_01_INVOICE]');

    process.env.TIGER_PERIOD_NR = '100';
    assert.throws(() => TigerTables.fromEnvironment(), /TIGER_PERIOD_NR must be an integer/);
  } finally {
    restore('FIRM_NR', previous.firm);
    restore('TIGER_PERIOD_NR', previous.period);
  }
});

function restore(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
