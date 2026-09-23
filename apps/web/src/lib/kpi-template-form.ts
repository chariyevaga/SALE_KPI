import { pickLocalizedText } from '../i18n/localized-text';
import type { TranslationKey, TranslationParams } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import type { KpiDefinition, KpiInputValue, KpiTemplate, SaveKpiTemplateInput } from '../types/api';

/** Mirrors the API rule (ADR-034): a template's weights add up to exactly this value. */
export const REQUIRED_TOTAL_WEIGHT = 100;

const WEIGHT_PATTERN = /^\d+(\.\d{1,2})?$/;
const TARGET_PATTERN = /^\d+(\.\d{1,4})?$/;
const MAX_TARGET_VALUE = 999_999_999_999_999;

export interface TemplateItemDraft {
  /** Client-only React key; the API regenerates item ids on every save. */
  key: string;
  kpiDefinitionId: string;
  weight: string;
  targetValue: string;
  inputValues: Record<string, KpiInputValue>;
}

export interface TemplateDraft {
  name: string;
  description: string;
  items: TemplateItemDraft[];
}

export interface DraftError {
  key: TranslationKey;
  params?: TranslationParams;
}

let itemKeySequence = 0;

export function emptyItemDraft(): TemplateItemDraft {
  itemKeySequence += 1;

  return {
    key: `item-${itemKeySequence}`,
    kpiDefinitionId: '',
    weight: '',
    targetValue: '',
    inputValues: {},
  };
}

export function draftFromTemplate(template: KpiTemplate): TemplateDraft {
  return {
    name: template.name,
    description: template.description ?? '',
    items: template.items.map((item) => ({
      ...emptyItemDraft(),
      kpiDefinitionId: item.kpiDefinitionId,
      weight: String(item.weight),
      targetValue: item.targetValue === null ? '' : String(item.targetValue),
      inputValues: item.inputValues,
    })),
  };
}

/** Accepts "33.5" as well as the Turkish/Russian decimal comma "33,5". */
function normalizeDecimal(text: string): string {
  return text.trim().replace(',', '.');
}

export function parseWeight(text: string): number | null {
  const normalized = normalizeDecimal(text);

  if (!WEIGHT_PATTERN.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  return value > 0 && value <= REQUIRED_TOTAL_WEIGHT ? value : null;
}

/** `undefined` means the text is not a valid target; an empty field is a valid `null`. */
export function parseTarget(text: string): number | null | undefined {
  const normalized = normalizeDecimal(text);

  if (normalized === '') {
    return null;
  }

  if (!TARGET_PATTERN.test(normalized)) {
    return undefined;
  }

  const value = Number(normalized);
  return value <= MAX_TARGET_VALUE ? value : undefined;
}

/** Sums in hundredths like the API, so 33.33 + 33.33 + 33.34 is exactly 100. */
export function totalWeight(items: readonly TemplateItemDraft[]): number {
  const hundredths = items.reduce((total, item) => {
    const value = Number(normalizeDecimal(item.weight));
    return total + (Number.isFinite(value) && value > 0 ? Math.round(value * 100) : 0);
  }, 0);

  return hundredths / 100;
}

export function isEmptyInputValue(value: KpiInputValue | undefined): boolean {
  return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

function cleanInputValues(values: Record<string, KpiInputValue>): Record<string, KpiInputValue> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => !isEmptyInputValue(value)),
  );
}

/** Same KPI + same inputs, independent of key order, list order and GUID letter case. */
function itemIdentity(item: TemplateItemDraft): string {
  const values = cleanInputValues(item.inputValues);
  const canonical = Object.keys(values)
    .sort()
    .map((key) => {
      const value = values[key];
      const sorted = Array.isArray(value)
        ? [...(value as (number | string)[])].sort((left, right) =>
            String(left).localeCompare(String(right), 'en', { numeric: true }),
          )
        : value;
      return `${key}=${JSON.stringify(sorted)}`;
    })
    .join('&');

  return `${item.kpiDefinitionId.toLowerCase()}|${canonical}`;
}

/** Returns the first problem in the order a user would fix them, or null when saveable. */
export function validateDraft(
  draft: TemplateDraft,
  definitionsById: ReadonlyMap<string, KpiDefinition>,
  locale: Locale,
): DraftError | null {
  if (!draft.name.trim()) {
    return { key: 'kpiTemplateForm.nameRequired' };
  }

  if (draft.items.length === 0) {
    return { key: 'kpiTemplateForm.itemsRequired' };
  }

  for (const [index, item] of draft.items.entries()) {
    const number = index + 1;

    if (!item.kpiDefinitionId) {
      return { key: 'kpiTemplateForm.definitionRequired', params: { number } };
    }

    if (parseWeight(item.weight) === null) {
      return { key: 'kpiTemplateForm.weightInvalid', params: { number } };
    }
  }

  const total = totalWeight(draft.items);

  if (total !== REQUIRED_TOTAL_WEIGHT) {
    return {
      key:
        total > REQUIRED_TOTAL_WEIGHT
          ? 'kpiTemplateForm.weightOver'
          : 'kpiTemplateForm.weightUnder',
      params: { total },
    };
  }

  const seen = new Map<string, number>();

  for (const [index, item] of draft.items.entries()) {
    const number = index + 1;

    if (parseTarget(item.targetValue) === undefined) {
      return { key: 'kpiTemplateForm.targetInvalid', params: { number } };
    }

    const definition = definitionsById.get(item.kpiDefinitionId.toLowerCase());
    const missing = definition?.inputSchema.find(
      (field) => field.required && isEmptyInputValue(item.inputValues[field.key]),
    );

    if (missing) {
      return {
        key: 'kpiTemplateForm.inputRequired',
        params: { number, field: pickLocalizedText(missing.label, locale) },
      };
    }

    const identity = itemIdentity(item);
    const other = seen.get(identity);

    if (other !== undefined) {
      return { key: 'kpiTemplateForm.duplicateItem', params: { number, other } };
    }

    seen.set(identity, number);
  }

  return null;
}

/** Call only after `validateDraft` returned null. */
export function toSaveInput(draft: TemplateDraft): SaveKpiTemplateInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    items: draft.items.map((item) => ({
      kpiDefinitionId: item.kpiDefinitionId,
      weight: parseWeight(item.weight) ?? 0,
      targetValue: parseTarget(item.targetValue) ?? null,
      inputValues: cleanInputValues(item.inputValues),
    })),
  };
}

/** Rebuilds the save body from server state, e.g. to reactivate without unsaved edits. */
export function saveInputFromTemplate(template: KpiTemplate): SaveKpiTemplateInput {
  return {
    name: template.name,
    description: template.description,
    items: template.items.map((item) => ({
      kpiDefinitionId: item.kpiDefinitionId,
      weight: item.weight,
      targetValue: item.targetValue,
      inputValues: item.inputValues,
    })),
  };
}
