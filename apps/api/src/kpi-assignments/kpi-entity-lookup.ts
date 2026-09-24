import { In, type Repository } from 'typeorm';

import { getFirmNumber } from '../config/environment.js';
import type { KpiScope } from '../kpi-definitions/kpi-definition.types.js';
import type { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import type { StoreEntity } from '../stores/entities/store.entity.js';

/**
 * Turns a plan row into the Tiger entities it is measured on. Store KPIs cover the stores
 * picked in `input_values` (their `nr`, not the local id); employee KPIs cover the plan
 * owner's Tiger salesperson reference. Both the target suggestions (ADR-038) and the
 * result calculation (ADR-041) map rows the same way, so the mapping lives here once.
 */

export interface LookupItem {
  id: string;
  inputValues: string;
  definition?: { code: string; scope: KpiScope };
}

export interface EntityLookup {
  itemId: string;
  kpiCode: string;
  /** More than one when the row covers several stores; their values are added up. */
  entityRefs: number[];
  currency: string | null;
  /**
   * Item group KPIs (ADR-045): the groups the row covers, added up like the stores. Absent for
   * every other KPI, whose value sources have no group column.
   */
  groupCodes?: string[];
}

export function readStoreIds(inputValues: string): number[] {
  const values = JSON.parse(inputValues) as Record<string, unknown>;
  const storeIds = values.storeIds;

  return Array.isArray(storeIds)
    ? storeIds.filter((id): id is number => typeof id === 'number')
    : [];
}

export function readCurrency(inputValues: string): string | null {
  const values = JSON.parse(inputValues) as Record<string, unknown>;

  return typeof values.currency === 'string' ? values.currency : null;
}

/** The item group codes of a group KPI row, as the input validator stored them. */
export function readGroupCodes(inputValues: string): string[] | null {
  const values = JSON.parse(inputValues) as Record<string, unknown>;
  const groupCodes = values.groupCodes;

  return Array.isArray(groupCodes)
    ? groupCodes.filter((code): code is string => typeof code === 'string')
    : null;
}

/** Local store id → Tiger branch number, for the stores the rows mention. */
export async function loadStoreNumbers(
  repository: Repository<StoreEntity>,
  items: readonly LookupItem[],
): Promise<Map<number, number>> {
  const storeIds = [...new Set(items.flatMap((item) => readStoreIds(item.inputValues)))];

  if (storeIds.length === 0) {
    return new Map();
  }

  const stores = await repository.find({
    select: { id: true, nr: true },
    where: { id: In(storeIds), firmNr: getFirmNumber() },
  });

  return new Map(stores.map((store) => [store.id, store.nr]));
}

/**
 * The Tiger salesperson references among `ids` that belong to the configured firm. An
 * employee linked to another firm's salesperson has no invoices here; measuring them would
 * read as "sold nothing" and score 0, so such a link counts as no link at all.
 */
export async function loadFirmSalespersonIds(
  repository: Repository<ErpEmployeeEntity>,
  ids: readonly (number | null | undefined)[],
): Promise<Set<number>> {
  const unique = [...new Set(ids.filter((id): id is number => typeof id === 'number'))];

  if (unique.length === 0) {
    return new Set();
  }

  const rows = await repository.find({
    select: { id: true },
    where: { id: In(unique), firmNr: getFirmNumber() },
  });

  return new Set(rows.map((row) => Number(row.id)));
}

/**
 * One lookup per row that can be measured. Rows whose entities cannot be resolved (a store
 * that is gone, an employee without a Tiger link) are left out and stay unmeasured.
 */
export function buildEntityLookups(
  items: readonly LookupItem[],
  options: { erpEmployeeId: number | null | undefined; storeNumbers: Map<number, number> },
): EntityLookup[] {
  return items.flatMap((item): EntityLookup[] => {
    const definition = item.definition;

    if (!definition) {
      throw new Error(`kpi_assignment_items[${item.id}] was loaded without its definition.`);
    }

    const entityRefs =
      definition.scope === 'store'
        ? readStoreIds(item.inputValues).flatMap((storeId) => {
            const nr = options.storeNumbers.get(storeId);

            return nr === undefined ? [] : [nr];
          })
        : [options.erpEmployeeId].flatMap((ref) =>
            ref === null || ref === undefined ? [] : [ref],
          );

    const groupCodes = readGroupCodes(item.inputValues);

    return entityRefs.length === 0
      ? []
      : [
          {
            itemId: item.id,
            kpiCode: definition.code,
            entityRefs,
            currency: readCurrency(item.inputValues),
            ...(groupCodes === null ? {} : { groupCodes }),
          },
        ];
  });
}

/**
 * A row of a KPI value source (`kpi_report_summary`, `kpi_month_values` and their item group
 * counterparts, which add `groupCode`).
 */
export interface EntityValueRow {
  kpiCode: string;
  entityRef: number;
  currency: string | null;
  groupCode?: string | null;
}

/**
 * The rows of one lookup: same KPI, same currency, any of the row's entities and, for item
 * group KPIs, any of its groups.
 */
export function matchRows<Row extends EntityValueRow>(
  lookup: EntityLookup,
  rows: readonly Row[],
): Row[] {
  const groups = lookup.groupCodes?.map((code) => code.toUpperCase());

  return rows.filter(
    (row) =>
      row.kpiCode === lookup.kpiCode &&
      lookup.entityRefs.includes(Number(row.entityRef)) &&
      (row.currency ?? null) === lookup.currency &&
      (groups === undefined ||
        (typeof row.groupCode === 'string' && groups.includes(row.groupCode.toUpperCase()))),
  );
}
