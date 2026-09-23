import type { KpiInputField, KpiLookupSource } from './kpi-input-schema.js';

/**
 * Validates the values a user entered for a definition's `input_schema` (ADR-032) and
 * returns them in canonical form: schema key order, empty optional fields dropped,
 * multi-value arrays sorted. Canonical values make duplicate detection a string compare.
 */

export type KpiInputValue = number | string | boolean | number[] | string[];

/** Lookup values per source: store ids are numbers, item group codes are strings (ADR-045). */
export interface KpiLookupValues {
  stores: number[];
  itemGroups: string[];
}

/** Longest Tiger item group code (`LG_xxx_ITEMS.STGRPCODE` is `varchar(25)`). */
export const ITEM_GROUP_CODE_MAX_LENGTH = 25;

export interface ParsedKpiInputValues {
  values: Record<string, KpiInputValue>;
  /** Referenced lookup values per source; the caller checks that they exist. */
  lookups: KpiLookupValues;
}

export class KpiInputValuesError extends Error {
  constructor(
    readonly path: string,
    problem: string,
  ) {
    super(`${path} ${problem}`);
    this.name = 'KpiInputValuesError';
  }
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-9;
}

function readArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new KpiInputValuesError(path, 'must be an array.');
  }

  return value;
}

function assertUnique(values: readonly (number | string)[], path: string): void {
  if (new Set(values).size !== values.length) {
    throw new KpiInputValuesError(path, 'contains duplicates.');
  }
}

function readLookupId(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new KpiInputValuesError(path, 'must be a positive integer id.');
  }

  return value;
}

/** Trimmed and upper-case, like `dbo.item_groups` lists the codes. */
function readGroupCode(value: unknown, path: string): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (code.length === 0 || code.length > ITEM_GROUP_CODE_MAX_LENGTH) {
    throw new KpiInputValuesError(
      path,
      `must be an item group code of 1-${ITEM_GROUP_CODE_MAX_LENGTH} characters.`,
    );
  }

  return code;
}

function parseLookup(
  source: KpiLookupSource,
  multiple: boolean,
  raw: unknown,
  path: string,
): KpiInputValue {
  if (source === 'itemGroups') {
    if (!multiple) {
      return readGroupCode(raw, path);
    }

    const codes = readArray(raw, path).map((value, index) =>
      readGroupCode(value, `${path}[${index}]`),
    );
    assertUnique(codes, path);

    return codes.sort();
  }

  if (!multiple) {
    return readLookupId(raw, path);
  }

  const ids = readArray(raw, path).map((value, index) => readLookupId(value, `${path}[${index}]`));
  assertUnique(ids, path);

  return ids.sort((left, right) => left - right);
}

function parseField(field: KpiInputField, raw: unknown, path: string): KpiInputValue {
  switch (field.type) {
    case 'number': {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) {
        throw new KpiInputValuesError(path, 'must be a number.');
      }

      if (field.min !== undefined && raw < field.min) {
        throw new KpiInputValuesError(path, `must be at least ${field.min}.`);
      }

      if (field.max !== undefined && raw > field.max) {
        throw new KpiInputValuesError(path, `must be at most ${field.max}.`);
      }

      if (field.decimals !== undefined && !hasAtMostDecimals(raw, field.decimals)) {
        throw new KpiInputValuesError(path, `must have at most ${field.decimals} decimals.`);
      }

      return raw;
    }
    case 'boolean':
      if (typeof raw !== 'boolean') {
        throw new KpiInputValuesError(path, 'must be a boolean.');
      }

      return raw;
    case 'select': {
      const order = field.options.map((option) => option.value);
      const readOption = (value: unknown, valuePath: string): string => {
        if (typeof value !== 'string' || !order.includes(value)) {
          throw new KpiInputValuesError(valuePath, `must be one of: ${order.join(', ')}.`);
        }

        return value;
      };

      if (!field.multiple) {
        return readOption(raw, path);
      }

      const selected = readArray(raw, path).map((value, index) =>
        readOption(value, `${path}[${index}]`),
      );
      assertUnique(selected, path);

      return selected.sort((left, right) => order.indexOf(left) - order.indexOf(right));
    }
    case 'lookup':
      return parseLookup(field.source, field.multiple, raw, path);
  }
}

export function parseKpiInputValues(
  schema: readonly KpiInputField[],
  input: unknown,
  path = 'inputValues',
): ParsedKpiInputValues {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new KpiInputValuesError(path, 'must be an object.');
  }

  const record = input as Record<string, unknown>;
  const knownKeys = new Set(schema.map((field) => field.key));
  const unknownKeys = Object.keys(record).filter((key) => !knownKeys.has(key));

  if (unknownKeys.length > 0) {
    throw new KpiInputValuesError(path, `has unknown fields: ${unknownKeys.join(', ')}.`);
  }

  const values: Record<string, KpiInputValue> = {};
  const lookups: KpiLookupValues = { stores: [], itemGroups: [] };

  for (const field of schema) {
    const fieldPath = `${path}.${field.key}`;
    const raw = record[field.key];

    if (isEmpty(raw)) {
      if (field.required) {
        throw new KpiInputValuesError(fieldPath, 'is required.');
      }

      continue;
    }

    const value = parseField(field, raw, fieldPath);
    values[field.key] = value;

    if (field.type === 'lookup') {
      const list: Array<number | string> = Array.isArray(value)
        ? value
        : [value as number | string];

      if (field.source === 'itemGroups') {
        lookups.itemGroups.push(
          ...list.filter((entry): entry is string => typeof entry === 'string'),
        );
      } else {
        lookups.stores.push(...list.filter((entry): entry is number => typeof entry === 'number'));
      }
    }
  }

  return { values, lookups };
}
