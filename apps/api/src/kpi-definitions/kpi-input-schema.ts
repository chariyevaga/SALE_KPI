/**
 * Contract of `kpi_definitions.name` and `kpi_definitions.input_schema` (ADR-032).
 * Definitions are seeded by migrations, so these parsers guard that contract at
 * read time instead of letting a malformed row reach the web form generator.
 */

export const KPI_LOCALES = ['tr', 'en', 'ru', 'tk'] as const;
export const KPI_INPUT_TYPES = ['number', 'select', 'lookup', 'boolean'] as const;
/**
 * `stores`: Tiger workplaces, values are `GET /stores` ids (numbers). `itemGroups`: Tiger item
 * group codes (`STGRPCODE`, ADR-045), values are the codes themselves (strings) because Logo
 * has no master table that would give them ids.
 */
export const KPI_LOOKUP_SOURCES = ['stores', 'itemGroups'] as const;

export type KpiLocale = (typeof KPI_LOCALES)[number];
export type KpiInputType = (typeof KPI_INPUT_TYPES)[number];
export type KpiLookupSource = (typeof KPI_LOOKUP_SOURCES)[number];

export type LocalizedText = { tr: string } & Partial<Record<Exclude<KpiLocale, 'tr'>, string>>;

interface KpiInputFieldBase {
  key: string;
  label: LocalizedText;
  required: boolean;
}

export interface KpiNumberInputField extends KpiInputFieldBase {
  type: 'number';
  min?: number;
  max?: number;
  decimals?: number;
}

export interface KpiSelectOption {
  value: string;
  label: LocalizedText;
}

export interface KpiSelectInputField extends KpiInputFieldBase {
  type: 'select';
  multiple: boolean;
  options: KpiSelectOption[];
}

export interface KpiLookupInputField extends KpiInputFieldBase {
  type: 'lookup';
  multiple: boolean;
  source: KpiLookupSource;
}

export interface KpiBooleanInputField extends KpiInputFieldBase {
  type: 'boolean';
}

export type KpiInputField =
  KpiNumberInputField | KpiSelectInputField | KpiLookupInputField | KpiBooleanInputField;

const INPUT_KEY_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const MAX_DECIMALS = 4;
const COMMON_FIELD_PROPERTIES = ['key', 'type', 'label', 'required'];
const FIELD_PROPERTIES: Record<KpiInputType, readonly string[]> = {
  number: [...COMMON_FIELD_PROPERTIES, 'min', 'max', 'decimals'],
  select: [...COMMON_FIELD_PROPERTIES, 'multiple', 'options'],
  lookup: [...COMMON_FIELD_PROPERTIES, 'multiple', 'source'],
  boolean: COMMON_FIELD_PROPERTIES,
};

export class KpiInputSchemaError extends Error {
  constructor(path: string, problem: string) {
    super(`${path} ${problem}`);
    this.name = 'KpiInputSchemaError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function includes<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function assertOnlyProperties(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  const unknown = Object.keys(value).filter((property) => !allowed.includes(property));

  if (unknown.length > 0) {
    throw new KpiInputSchemaError(path, `has unknown properties: ${unknown.join(', ')}.`);
  }
}

function readOptionalBoolean(value: unknown, path: string): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value !== 'boolean') {
    throw new KpiInputSchemaError(path, 'must be a boolean.');
  }

  return value;
}

function readOptionalFiniteNumber(value: unknown, path: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new KpiInputSchemaError(path, 'must be a finite number.');
  }

  return value;
}

export function parseLocalizedText(value: unknown, path = 'name'): LocalizedText {
  if (!isRecord(value)) {
    throw new KpiInputSchemaError(path, 'must be an object keyed by locale.');
  }

  assertOnlyProperties(value, KPI_LOCALES, path);

  const text: Record<string, string> = {};

  for (const locale of KPI_LOCALES) {
    const translation = value[locale];

    if (translation === undefined) {
      continue;
    }

    if (typeof translation !== 'string' || translation.trim() === '') {
      throw new KpiInputSchemaError(`${path}.${locale}`, 'must be a non-empty string.');
    }

    text[locale] = translation;
  }

  if (text.tr === undefined) {
    throw new KpiInputSchemaError(`${path}.tr`, 'is required.');
  }

  return text as LocalizedText;
}

function parseSelectOptions(value: unknown, path: string): KpiSelectOption[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new KpiInputSchemaError(path, 'must be a non-empty array.');
  }

  const seen = new Set<string>();

  return value.map((option, index) => {
    const optionPath = `${path}[${index}]`;

    if (!isRecord(option)) {
      throw new KpiInputSchemaError(optionPath, 'must be an object.');
    }

    assertOnlyProperties(option, ['value', 'label'], optionPath);

    if (typeof option.value !== 'string' || option.value === '') {
      throw new KpiInputSchemaError(`${optionPath}.value`, 'must be a non-empty string.');
    }

    if (seen.has(option.value)) {
      throw new KpiInputSchemaError(`${optionPath}.value`, `duplicates "${option.value}".`);
    }

    seen.add(option.value);

    return {
      value: option.value,
      label: parseLocalizedText(option.label, `${optionPath}.label`),
    };
  });
}

function parseInputField(value: unknown, path: string): KpiInputField {
  if (!isRecord(value)) {
    throw new KpiInputSchemaError(path, 'must be an object.');
  }

  if (!includes(KPI_INPUT_TYPES, value.type)) {
    throw new KpiInputSchemaError(`${path}.type`, `must be one of: ${KPI_INPUT_TYPES.join(', ')}.`);
  }

  assertOnlyProperties(value, FIELD_PROPERTIES[value.type], path);

  if (typeof value.key !== 'string' || !INPUT_KEY_PATTERN.test(value.key)) {
    throw new KpiInputSchemaError(`${path}.key`, 'must be a camelCase identifier.');
  }

  if (typeof value.required !== 'boolean') {
    throw new KpiInputSchemaError(`${path}.required`, 'must be a boolean.');
  }

  const base = {
    key: value.key,
    label: parseLocalizedText(value.label, `${path}.label`),
    required: value.required,
  };

  switch (value.type) {
    case 'number': {
      const min = readOptionalFiniteNumber(value.min, `${path}.min`);
      const max = readOptionalFiniteNumber(value.max, `${path}.max`);
      const decimals = readOptionalFiniteNumber(value.decimals, `${path}.decimals`);

      if (min !== undefined && max !== undefined && min > max) {
        throw new KpiInputSchemaError(path, 'has min greater than max.');
      }

      if (
        decimals !== undefined &&
        (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS)
      ) {
        throw new KpiInputSchemaError(
          `${path}.decimals`,
          `must be an integer between 0 and ${MAX_DECIMALS}.`,
        );
      }

      return {
        ...base,
        type: 'number',
        ...(min === undefined ? {} : { min }),
        ...(max === undefined ? {} : { max }),
        ...(decimals === undefined ? {} : { decimals }),
      };
    }
    case 'select':
      return {
        ...base,
        type: 'select',
        multiple: readOptionalBoolean(value.multiple, `${path}.multiple`),
        options: parseSelectOptions(value.options, `${path}.options`),
      };
    case 'lookup':
      if (!includes(KPI_LOOKUP_SOURCES, value.source)) {
        throw new KpiInputSchemaError(
          `${path}.source`,
          `must be one of: ${KPI_LOOKUP_SOURCES.join(', ')}.`,
        );
      }

      return {
        ...base,
        type: 'lookup',
        multiple: readOptionalBoolean(value.multiple, `${path}.multiple`),
        source: value.source,
      };
    case 'boolean':
      return { ...base, type: 'boolean' };
  }
}

export function parseKpiInputSchema(value: unknown, path = 'inputSchema'): KpiInputField[] {
  if (!Array.isArray(value)) {
    throw new KpiInputSchemaError(path, 'must be an array.');
  }

  const keys = new Set<string>();

  return value.map((item, index) => {
    const field = parseInputField(item, `${path}[${index}]`);

    if (keys.has(field.key)) {
      throw new KpiInputSchemaError(`${path}[${index}].key`, `duplicates "${field.key}".`);
    }

    keys.add(field.key);

    return field;
  });
}
