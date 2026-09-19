import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseKpiInputSchema } from './kpi-input-schema.js';
import { KpiInputValuesError, parseKpiInputValues } from './kpi-input-values.js';

const STORE_SALES_SCHEMA = parseKpiInputSchema([
  {
    key: 'storeIds',
    type: 'lookup',
    label: { tr: 'Mağazalar' },
    required: true,
    multiple: true,
    source: 'stores',
  },
  {
    key: 'currency',
    type: 'select',
    label: { tr: 'Para birimi' },
    required: true,
    options: [
      { value: 'TMT', label: { tr: 'Manat' } },
      { value: 'USD', label: { tr: 'Dolar' } },
    ],
  },
]);

const MIXED_SCHEMA = parseKpiInputSchema([
  { key: 'minDays', type: 'number', label: { tr: 'Gün' }, required: false, min: 1, decimals: 0 },
  { key: 'includeReturns', type: 'boolean', label: { tr: 'İadeler' }, required: false },
  {
    key: 'channels',
    type: 'select',
    label: { tr: 'Kanal' },
    required: false,
    multiple: true,
    options: [
      { value: 'STORE', label: { tr: 'Mağaza' } },
      { value: 'ONLINE', label: { tr: 'Online' } },
    ],
  },
]);

void test('normalizes filled values into schema order with sorted lookup ids', () => {
  const parsed = parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: [4, 2] });

  assert.deepEqual(parsed.values, { storeIds: [2, 4], currency: 'TMT' });
  assert.deepEqual(Object.keys(parsed.values), ['storeIds', 'currency']);
  assert.deepEqual([...parsed.lookupIds], [['stores', [2, 4]]]);
});

void test('accepts an empty object for a schema without fields', () => {
  assert.deepEqual(parseKpiInputValues([], {}).values, {});
});

void test('rejects missing required values, including empty arrays and strings', () => {
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT' }),
    /inputValues\.storeIds is required/,
  );
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: '', storeIds: [2] }),
    /inputValues\.currency is required/,
  );
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: [] }),
    /inputValues\.storeIds is required/,
  );
});

void test('rejects fields the schema does not define', () => {
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: [2], extra: 1 }),
    /unknown fields: extra/,
  );
});

void test('rejects select values outside the options', () => {
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'EUR', storeIds: [2] }),
    /inputValues\.currency must be one of: TMT, USD/,
  );
});

void test('rejects malformed or repeated lookup ids', () => {
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: [2, 2] }),
    /contains duplicates/,
  );
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: ['2'] }),
    /storeIds\[0\] must be a positive integer id/,
  );
  assert.throws(
    () => parseKpiInputValues(STORE_SALES_SCHEMA, { currency: 'TMT', storeIds: 2 }),
    /storeIds must be an array/,
  );
});

void test('validates numbers, booleans and multi-select values of optional fields', () => {
  assert.deepEqual(
    parseKpiInputValues(MIXED_SCHEMA, {
      minDays: 3,
      includeReturns: false,
      channels: ['ONLINE', 'STORE'],
    }).values,
    { minDays: 3, includeReturns: false, channels: ['STORE', 'ONLINE'] },
  );
  assert.deepEqual(parseKpiInputValues(MIXED_SCHEMA, { minDays: null }).values, {});
  assert.throws(() => parseKpiInputValues(MIXED_SCHEMA, { minDays: 0 }), /at least 1/);
  assert.throws(() => parseKpiInputValues(MIXED_SCHEMA, { minDays: 1.5 }), /at most 0 decimals/);
  assert.throws(
    () => parseKpiInputValues(MIXED_SCHEMA, { includeReturns: 'yes' }),
    KpiInputValuesError,
  );
});
