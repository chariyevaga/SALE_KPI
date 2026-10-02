import type { MigrationInterface, QueryRunner } from 'typeorm';

// Numbers the KPI names (ADR-060): store KPIs first, then employee KPIs, each group in its
// catalog order — "#1 Mağaza bazında ciro" … "#15 Personel bazında malzeme grubu cirosu". The
// number goes in front of every language of `name`; `code` does not change. sort_order follows
// the number (number × 10), so the catalog lists #1 to #15 in order instead of alternating
// store and employee KPIs.
//
// The numbers and the previous sort orders are inlined: a migration is a snapshot. The names are
// read from the table, so the prefix lands on whatever text the row carries. Updating rows from
// a migration is a system write: updated_by is NULL and nothing is written to audit_logs
// (ADR-036).

/** Catalog order: the number of a definition is its index + 1. */
const NUMBERED_DEFINITIONS = [
  { code: 'STORE_SALES', previousSortOrder: 10 },
  { code: 'STORE_RECEIPTS', previousSortOrder: 30 },
  { code: 'STORE_CUSTOMERS', previousSortOrder: 50 },
  { code: 'STORE_NEW_CUSTOMERS', previousSortOrder: 70 },
  { code: 'STORE_RETURNING_CUSTOMERS', previousSortOrder: 90 },
  { code: 'STORE_PRODUCT_VARIETY', previousSortOrder: 110 },
  { code: 'STORE_CONVERSION', previousSortOrder: 130 },
  { code: 'STORE_GROUP_SALES', previousSortOrder: 150 },
  { code: 'EMPLOYEE_SALES', previousSortOrder: 20 },
  { code: 'EMPLOYEE_RECEIPTS', previousSortOrder: 40 },
  { code: 'EMPLOYEE_CUSTOMERS', previousSortOrder: 60 },
  { code: 'EMPLOYEE_NEW_CUSTOMERS', previousSortOrder: 80 },
  { code: 'EMPLOYEE_RETURNING_CUSTOMERS', previousSortOrder: 100 },
  { code: 'EMPLOYEE_PRODUCT_VARIETY', previousSortOrder: 120 },
  { code: 'EMPLOYEE_GROUP_SALES', previousSortOrder: 160 },
] as const;

/** A catalog number already in front of a name ("#12 "); up replaces it instead of stacking. */
const NUMBER_PREFIX = /^#\d+ /;

interface DefinitionRow {
  code: string;
  name: string;
}

/** Applies `rename` to every language value of the `name` JSON. */
function renameEveryLanguage(row: DefinitionRow, rename: (value: string) => string): string {
  const name = JSON.parse(row.name) as unknown;

  if (!name || typeof name !== 'object' || Array.isArray(name)) {
    throw new Error(`kpi_definitions.name of ${row.code} is not a JSON object.`);
  }

  return JSON.stringify(
    Object.fromEntries(
      Object.entries(name).map(([locale, value]) => [
        locale,
        typeof value === 'string' ? rename(value) : value,
      ]),
    ),
  );
}

async function loadRows(queryRunner: QueryRunner): Promise<Map<string, DefinitionRow>> {
  const rows = (await queryRunner.query(
    'SELECT [code], [name] FROM [dbo].[kpi_definitions]',
  )) as DefinitionRow[];

  return new Map(rows.map((row) => [row.code, row]));
}

async function updateRow(
  queryRunner: QueryRunner,
  code: string,
  name: string,
  sortOrder: number,
): Promise<void> {
  await queryRunner.query(
    `
      UPDATE [dbo].[kpi_definitions]
      SET [name] = @0,
          [sort_order] = @1,
          [updated_at] = SYSUTCDATETIME(),
          [updated_by] = NULL
      WHERE [code] = @2
    `,
    [name, sortOrder, code],
  );
}

export class NumberKpiDefinitionNames1799704800000 implements MigrationInterface {
  name = 'NumberKpiDefinitionNames1799704800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await loadRows(queryRunner);
    const numbered = new Set<string>(NUMBERED_DEFINITIONS.map(({ code }) => code));
    const missing = [...numbered].filter((code) => !rows.has(code));
    const unexpected = [...rows.keys()].filter((code) => !numbered.has(code));

    // The numbers only mean something for the whole catalog: stop rather than number a part.
    if (missing.length > 0 || unexpected.length > 0) {
      throw new Error(
        'kpi_definitions differs from the catalog this migration numbers ' +
          `(missing: ${missing.join(', ') || '-'}; unexpected: ${unexpected.join(', ') || '-'}).`,
      );
    }

    for (const [index, { code }] of NUMBERED_DEFINITIONS.entries()) {
      const number = index + 1;
      const name = renameEveryLanguage(
        rows.get(code)!,
        (value) => `#${number} ${value.replace(NUMBER_PREFIX, '')}`,
      );

      await updateRow(queryRunner, code, name, number * 10);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows = await loadRows(queryRunner);

    for (const [index, { code, previousSortOrder }] of NUMBERED_DEFINITIONS.entries()) {
      const row = rows.get(code);

      if (!row) {
        continue;
      }

      const prefix = `#${index + 1} `;
      const name = renameEveryLanguage(row, (value) =>
        value.startsWith(prefix) ? value.slice(prefix.length) : value,
      );

      await updateRow(queryRunner, code, name, previousSortOrder);
    }
  }
}
