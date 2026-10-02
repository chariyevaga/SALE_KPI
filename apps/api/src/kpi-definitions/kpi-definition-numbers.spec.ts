import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { QueryRunner } from 'typeorm';

import { CreateKpiDefinitions1799703200000 } from '../database/migrations/1799703200000-create-kpi-definitions.js';
import { NumberKpiDefinitionNames1799704800000 } from '../database/migrations/1799704800000-number-kpi-definition-names.js';
import { KPI_LOCALES } from './kpi-input-schema.js';

interface Row {
  code: string;
  scope: string;
  name: string;
  sortOrder: number;
}

/** The catalog before 1799704800000: the 1799703200000 seeds, the group sales, no discipline. */
async function currentCatalog(): Promise<Row[]> {
  const rows: Row[] = [];
  const queryRunner = {
    query(sql: string, parameters?: unknown[]): Promise<void> {
      if (sql.includes('INSERT INTO [dbo].[kpi_definitions]') && parameters) {
        const [code, scope, , , name, , sortOrder] = parameters;

        rows.push({
          code: code as string,
          scope: scope as string,
          name: name as string,
          sortOrder: sortOrder as number,
        });
      }

      return Promise.resolve();
    },
  } as unknown as QueryRunner;

  await new CreateKpiDefinitions1799703200000().up(queryRunner);

  return [
    ...rows.filter((row) => row.code !== 'EMPLOYEE_DISCIPLINE'),
    {
      code: 'STORE_GROUP_SALES',
      scope: 'store',
      name: JSON.stringify({
        tr: 'Mağaza bazında malzeme grubu cirosu',
        en: 'Item group sales by store',
        ru: 'Выручка по группам товаров в магазине',
        tk: 'Dükan boýunça haryt topary satuwy',
      }),
      sortOrder: 150,
    },
    {
      code: 'EMPLOYEE_GROUP_SALES',
      scope: 'employee',
      name: JSON.stringify({
        tr: 'Personel bazında malzeme grubu cirosu',
        en: 'Item group sales by employee',
        ru: 'Выручка по группам товаров сотрудника',
        tk: 'Işgär boýunça haryt topary satuwy',
      }),
      sortOrder: 160,
    },
  ];
}

/** Runs the migration against an in-memory kpi_definitions table. */
async function run(step: 'up' | 'down', table: Row[]): Promise<Row[]> {
  const rows = table.map((row) => ({ ...row }));
  const queryRunner = {
    query(sql: string, parameters?: unknown[]): Promise<unknown> {
      if (sql.startsWith('SELECT')) {
        return Promise.resolve(rows.map(({ code, name }) => ({ code, name })));
      }

      assert.match(sql, /UPDATE \[dbo\]\.\[kpi_definitions\]/);
      assert.match(sql, /\[updated_at\] = SYSUTCDATETIME\(\)/);

      const [name, sortOrder, code] = parameters as [string, number, string];
      const row = rows.find((candidate) => candidate.code === code);

      assert.ok(row, code);
      row.name = name;
      row.sortOrder = sortOrder;

      return Promise.resolve([]);
    },
  } as unknown as QueryRunner;

  await new NumberKpiDefinitionNames1799704800000()[step](queryRunner);

  return rows;
}

function names(row: Row): Record<string, string> {
  return JSON.parse(row.name) as Record<string, string>;
}

void test('numbers store KPIs first, then employee KPIs, each in its catalog order', async () => {
  const before = await currentCatalog();
  const expectedOrder = ['store', 'employee'].flatMap((scope) =>
    before
      .filter((row) => row.scope === scope)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((row) => row.code),
  );
  const after = await run('up', before);

  assert.equal(after.length, 15);
  assert.deepEqual(
    [...after].sort((left, right) => left.sortOrder - right.sortOrder).map((row) => row.code),
    expectedOrder,
  );
  assert.equal(expectedOrder[0], 'STORE_SALES');
  assert.equal(expectedOrder[1], 'STORE_RECEIPTS');
  assert.equal(expectedOrder[8], 'EMPLOYEE_SALES');

  for (const [index, code] of expectedOrder.entries()) {
    const number = index + 1;
    const original = names(before.find((row) => row.code === code)!);
    const numbered = after.find((row) => row.code === code)!;

    assert.equal(numbered.sortOrder, number * 10, code);

    for (const locale of KPI_LOCALES) {
      assert.equal(names(numbered)[locale], `#${number} ${original[locale]}`, `${code} ${locale}`);
    }
  }
});

void test('keeps a single number when a name already carries one', async () => {
  const before = await currentCatalog();
  const once = await run('up', before);
  const twice = await run('up', once);

  assert.deepEqual(twice, once);
});

void test('down restores the names and sort orders the rows had', async () => {
  const before = await currentCatalog();
  const restored = await run('down', await run('up', before));

  assert.deepEqual(restored, before);
});

void test('stops when the catalog is not the one it numbers', async () => {
  const before = await currentCatalog();

  await assert.rejects(
    run(
      'up',
      before.filter((row) => row.code !== 'STORE_CONVERSION'),
    ),
    /missing: STORE_CONVERSION; unexpected: -/,
  );
  await assert.rejects(
    run('up', [
      ...before,
      { code: 'EMPLOYEE_DISCIPLINE', scope: 'employee', name: '{"tr":"x"}', sortOrder: 140 },
    ]),
    /missing: -; unexpected: EMPLOYEE_DISCIPLINE/,
  );
});
