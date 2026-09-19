import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { CreateKpiDefinitions1799703200000 } from '../database/migrations/1799703200000-create-kpi-definitions.js';
import { KPI_INPUT_MODES, KPI_SCOPES, KPI_UNITS } from './kpi-definition.types.js';
import { KPI_LOCALES, parseKpiInputSchema, parseLocalizedText } from './kpi-input-schema.js';

interface SeededDefinition {
  code: string;
  scope: string;
  unit: string;
  inputMode: string;
  name: unknown;
  inputSchema: unknown;
  sortOrder: number;
}

async function runSeedMigration(): Promise<SeededDefinition[]> {
  const inserts: unknown[][] = [];
  const queryRunner = {
    query(sql: string, parameters?: unknown[]): Promise<void> {
      if (sql.includes('INSERT INTO [dbo].[kpi_definitions]') && parameters) {
        inserts.push(parameters);
      }

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new CreateKpiDefinitions1799703200000().up(queryRunner);

  return inserts.map(([code, scope, unit, inputMode, name, inputSchema, sortOrder]) => ({
    code: code as string,
    scope: scope as string,
    unit: unit as string,
    inputMode: inputMode as string,
    name: JSON.parse(name as string) as unknown,
    inputSchema: JSON.parse(inputSchema as string) as unknown,
    sortOrder: sortOrder as number,
  }));
}

void test('seeds the 14 agreed KPI codes in catalog order', async () => {
  const definitions = await runSeedMigration();

  assert.deepEqual(
    definitions.map((definition) => definition.code),
    [
      'STORE_SALES',
      'EMPLOYEE_SALES',
      'STORE_RECEIPTS',
      'EMPLOYEE_RECEIPTS',
      'STORE_CUSTOMERS',
      'EMPLOYEE_CUSTOMERS',
      'STORE_NEW_CUSTOMERS',
      'EMPLOYEE_NEW_CUSTOMERS',
      'STORE_RETURNING_CUSTOMERS',
      'EMPLOYEE_RETURNING_CUSTOMERS',
      'STORE_PRODUCT_VARIETY',
      'EMPLOYEE_PRODUCT_VARIETY',
      'STORE_CONVERSION',
      'EMPLOYEE_DISCIPLINE',
    ],
  );
  assert.deepEqual(
    definitions.map((definition) => definition.sortOrder),
    definitions.map((_, index) => (index + 1) * 10),
  );
});

void test('every seeded row satisfies the definition contract in all four languages', async () => {
  for (const definition of await runSeedMigration()) {
    assert.match(definition.code, /^(STORE|EMPLOYEE)_[A-Z_]+$/);
    assert.ok((KPI_SCOPES as readonly string[]).includes(definition.scope), definition.code);
    assert.ok((KPI_UNITS as readonly string[]).includes(definition.unit), definition.code);
    assert.ok(
      (KPI_INPUT_MODES as readonly string[]).includes(definition.inputMode),
      definition.code,
    );
    assert.equal(definition.scope, definition.code.startsWith('STORE_') ? 'store' : 'employee');

    const name = parseLocalizedText(definition.name);
    const schema = parseKpiInputSchema(definition.inputSchema);

    for (const text of [name, ...schema.map((field) => field.label)]) {
      assert.deepEqual(Object.keys(text), [...KPI_LOCALES], definition.code);
    }
  }
});

void test('store KPIs require stores while employee KPIs never ask for one', async () => {
  for (const definition of await runSeedMigration()) {
    const storeField = parseKpiInputSchema(definition.inputSchema).find(
      (field) => field.key === 'storeIds',
    );

    if (definition.scope === 'store') {
      assert.deepEqual(
        storeField && {
          type: storeField.type,
          required: storeField.required,
          source: storeField.type === 'lookup' ? storeField.source : undefined,
        },
        { type: 'lookup', required: true, source: 'stores' },
        definition.code,
      );
    } else {
      assert.equal(storeField, undefined, definition.code);
    }
  }
});

void test('sales KPIs ask for a TMT or USD currency and only discipline is manual', async () => {
  const definitions = await runSeedMigration();

  for (const definition of definitions) {
    const currency = parseKpiInputSchema(definition.inputSchema).find(
      (field) => field.key === 'currency',
    );

    if (definition.code.endsWith('_SALES')) {
      assert.equal(definition.unit, 'money');
      assert.ok(currency?.type === 'select' && currency.required, definition.code);
      assert.deepEqual(
        currency.options.map((option) => option.value),
        ['TMT', 'USD'],
      );
    } else {
      assert.equal(currency, undefined, definition.code);
    }
  }

  assert.deepEqual(
    definitions.filter((definition) => definition.inputMode === 'manual').map((row) => row.code),
    ['EMPLOYEE_DISCIPLINE'],
  );
});
