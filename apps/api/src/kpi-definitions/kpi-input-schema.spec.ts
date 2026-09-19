import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { KpiDefinitionEntity } from './entities/kpi-definition.entity.js';
import { toKpiDefinitionResponse } from './kpi-definition-response.js';
import {
  KpiInputSchemaError,
  parseKpiInputSchema,
  parseLocalizedText,
} from './kpi-input-schema.js';

const LABEL = { tr: 'Mağazalar', en: 'Stores' };

function storeIdsField(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key: 'storeIds',
    type: 'lookup',
    label: LABEL,
    required: true,
    multiple: true,
    source: 'stores',
    ...overrides,
  };
}

function currencyField(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key: 'currency',
    type: 'select',
    label: { tr: 'Para birimi' },
    required: true,
    options: [
      { value: 'TMT', label: { tr: 'Türkmen manatı (TMT)' } },
      { value: 'USD', label: { tr: 'ABD doları (USD)' } },
    ],
    ...overrides,
  };
}

void test('parses lookup and select fields and defaults multiple to false', () => {
  assert.deepEqual(parseKpiInputSchema([storeIdsField(), currencyField()]), [
    {
      key: 'storeIds',
      type: 'lookup',
      label: LABEL,
      required: true,
      multiple: true,
      source: 'stores',
    },
    {
      key: 'currency',
      type: 'select',
      label: { tr: 'Para birimi' },
      required: true,
      multiple: false,
      options: [
        { value: 'TMT', label: { tr: 'Türkmen manatı (TMT)' } },
        { value: 'USD', label: { tr: 'ABD doları (USD)' } },
      ],
    },
  ]);
});

void test('accepts an empty schema for KPIs that ask nothing besides the target', () => {
  assert.deepEqual(parseKpiInputSchema([]), []);
});

void test('parses number and boolean fields with their optional limits', () => {
  assert.deepEqual(
    parseKpiInputSchema([
      {
        key: 'minDays',
        type: 'number',
        label: { tr: 'Gün' },
        required: false,
        min: 1,
        decimals: 0,
      },
      { key: 'includeReturns', type: 'boolean', label: { tr: 'İadeler' }, required: false },
    ]),
    [
      {
        key: 'minDays',
        type: 'number',
        label: { tr: 'Gün' },
        required: false,
        min: 1,
        decimals: 0,
      },
      { key: 'includeReturns', type: 'boolean', label: { tr: 'İadeler' }, required: false },
    ],
  );
});

void test('rejects values that are not a schema array', () => {
  assert.throws(() => parseKpiInputSchema({ storeIds: true }), KpiInputSchemaError);
});

void test('rejects an unknown field type', () => {
  assert.throws(
    () => parseKpiInputSchema([storeIdsField({ type: 'date' })]),
    /inputSchema\[0\]\.type must be one of/,
  );
});

void test('rejects a lookup source that is not allowlisted', () => {
  assert.throws(
    () => parseKpiInputSchema([storeIdsField({ source: 'https://example.com/stores' })]),
    /inputSchema\[0\]\.source must be one of: stores/,
  );
});

void test('rejects properties that do not belong to the field type', () => {
  assert.throws(
    () => parseKpiInputSchema([storeIdsField({ options: [] })]),
    /unknown properties: options/,
  );
  assert.throws(
    () => parseKpiInputSchema([currencyField({ requird: true })]),
    /unknown properties: requird/,
  );
});

void test('requires an explicit required flag', () => {
  assert.throws(
    () => parseKpiInputSchema([storeIdsField({ required: undefined })]),
    /inputSchema\[0\]\.required must be a boolean/,
  );
});

void test('rejects select fields without options or with duplicate option values', () => {
  assert.throws(
    () => parseKpiInputSchema([currencyField({ options: [] })]),
    /options must be a non-empty array/,
  );
  assert.throws(
    () =>
      parseKpiInputSchema([
        currencyField({
          options: [
            { value: 'TMT', label: { tr: 'Manat' } },
            { value: 'TMT', label: { tr: 'Manat' } },
          ],
        }),
      ]),
    /duplicates "TMT"/,
  );
});

void test('rejects duplicate field keys and non camelCase keys', () => {
  assert.throws(
    () => parseKpiInputSchema([storeIdsField(), storeIdsField()]),
    /inputSchema\[1\]\.key duplicates "storeIds"/,
  );
  assert.throws(
    () => parseKpiInputSchema([storeIdsField({ key: 'store_ids' })]),
    /must be a camelCase identifier/,
  );
});

void test('rejects number fields with inverted limits or unsupported decimals', () => {
  const field = { key: 'target', type: 'number', label: { tr: 'Hedef' }, required: true };

  assert.throws(() => parseKpiInputSchema([{ ...field, min: 10, max: 1 }]), /min greater than max/);
  assert.throws(() => parseKpiInputSchema([{ ...field, decimals: 5 }]), /between 0 and 4/);
});

void test('requires a Turkish text and rejects unknown or empty locales', () => {
  assert.deepEqual(parseLocalizedText({ tr: 'Ciro', tk: 'Satuw' }), { tr: 'Ciro', tk: 'Satuw' });
  assert.throws(() => parseLocalizedText({ en: 'Sales' }), /name\.tr is required/);
  assert.throws(() => parseLocalizedText({ tr: 'Ciro', de: 'Umsatz' }), /unknown properties: de/);
  assert.throws(() => parseLocalizedText({ tr: 'Ciro', ru: '  ' }), /name\.ru must be a non-empty/);
});

void test('maps a definition row and names the row when its JSON is malformed', () => {
  const definition = {
    id: '8A3C2F0E-0000-4000-8000-000000000001',
    code: 'STORE_SALES',
    scope: 'store',
    unit: 'money',
    inputMode: 'calculated',
    name: JSON.stringify({ tr: 'Mağaza bazında ciro' }),
    inputSchema: JSON.stringify([storeIdsField()]),
    sortOrder: 10,
  } as KpiDefinitionEntity;

  const response = toKpiDefinitionResponse(definition);

  assert.equal(response.code, 'STORE_SALES');
  assert.deepEqual(response.name, { tr: 'Mağaza bazında ciro' });
  assert.equal(response.inputSchema[0]?.source, 'stores');

  assert.throws(
    () => toKpiDefinitionResponse({ ...definition, inputSchema: '[{' }),
    /kpi_definitions\[STORE_SALES\]\.input_schema is not valid JSON/,
  );
});
