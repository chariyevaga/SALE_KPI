import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildEntityLookups, type LookupItem, matchRows } from './kpi-entity-lookup.js';

/** Local store id → Tiger branch number, as `loadStoreNumbers` returns it. */
const storeNumbers = new Map([
  [6, 0],
  [7, 2],
]);

function item(code: string, scope: 'store' | 'employee', inputValues: object): LookupItem {
  return {
    id: `item-${code}`,
    inputValues: JSON.stringify(inputValues),
    definition: { code, scope },
  };
}

const rows = [
  { kpiCode: 'STORE_SALES', entityRef: 0, currency: 'TMT', groupCode: null, value: 1000 },
  { kpiCode: 'STORE_GROUP_SALES', entityRef: 0, currency: 'TMT', groupCode: 'ELBISE', value: 300 },
  { kpiCode: 'STORE_GROUP_SALES', entityRef: 0, currency: 'TMT', groupCode: 'TUFLI', value: 120 },
  { kpiCode: 'STORE_GROUP_SALES', entityRef: 0, currency: 'TMT', groupCode: 'SUMKA', value: 80 },
  { kpiCode: 'STORE_GROUP_SALES', entityRef: 2, currency: 'TMT', groupCode: 'ELBISE', value: 50 },
  { kpiCode: 'STORE_GROUP_SALES', entityRef: 0, currency: 'USD', groupCode: 'ELBISE', value: 15 },
  {
    kpiCode: 'EMPLOYEE_GROUP_SALES',
    entityRef: 41,
    currency: 'TMT',
    groupCode: 'ELBISE',
    value: 90,
  },
];

function total(matched: ReadonlyArray<{ value: number }>): number {
  return matched.reduce((sum, row) => sum + row.value, 0);
}

void test('a group KPI row carries its groups and counts only them', () => {
  const [lookup] = buildEntityLookups(
    [
      item('STORE_GROUP_SALES', 'store', {
        storeIds: [6],
        groupCodes: ['ELBISE', 'TUFLI'],
        currency: 'TMT',
      }),
    ],
    { erpEmployeeId: null, storeNumbers },
  );

  assert.deepEqual(lookup?.groupCodes, ['ELBISE', 'TUFLI']);
  // SUMKA and the USD row are left out.
  assert.equal(total(matchRows(lookup, rows)), 420);
});

void test('several stores and several groups are added up', () => {
  const [lookup] = buildEntityLookups(
    [
      item('STORE_GROUP_SALES', 'store', {
        storeIds: [6, 7],
        groupCodes: ['ELBISE'],
        currency: 'TMT',
      }),
    ],
    { erpEmployeeId: null, storeNumbers },
  );

  assert.equal(total(matchRows(lookup!, rows)), 350);
});

void test('an employee group KPI is measured through the Tiger salesperson', () => {
  const [lookup] = buildEntityLookups(
    [item('EMPLOYEE_GROUP_SALES', 'employee', { groupCodes: ['ELBISE'], currency: 'TMT' })],
    { erpEmployeeId: 41, storeNumbers },
  );

  assert.deepEqual(lookup?.entityRefs, [41]);
  assert.equal(total(matchRows(lookup, rows)), 90);
});

void test('KPIs without groups match as before and never pick up group rows', () => {
  const [lookup] = buildEntityLookups(
    [item('STORE_SALES', 'store', { storeIds: [6], currency: 'TMT' })],
    { erpEmployeeId: null, storeNumbers },
  );

  assert.equal(lookup?.groupCodes, undefined);
  assert.equal(total(matchRows(lookup!, rows)), 1000);
});

void test('group codes compare without regard to case', () => {
  const [lookup] = buildEntityLookups(
    [
      item('STORE_GROUP_SALES', 'store', {
        storeIds: [6],
        groupCodes: ['elbise'],
        currency: 'TMT',
      }),
    ],
    { erpEmployeeId: null, storeNumbers },
  );

  assert.equal(total(matchRows(lookup!, rows)), 300);
});
