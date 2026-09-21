/** Every template's item weights must add up to exactly this value (ADR-034). */
export const REQUIRED_TOTAL_WEIGHT = 100;

/**
 * Sums weights in hundredths so 33.33 + 33.33 + 33.34 is exactly 100, which plain
 * floating-point addition does not guarantee.
 */
export function sumWeights(weights: readonly number[]): number {
  const hundredths = weights.reduce((total, weight) => total + Math.round(weight * 100), 0);
  return hundredths / 100;
}

/** Canonical key of an item; two items with the same key are the same KPI with the same inputs. */
export function templateItemKey(kpiDefinitionId: string, canonicalInputValues: string): string {
  return `${kpiDefinitionId.toLowerCase()}|${canonicalInputValues}`;
}

export const TEMPLATE_NAME_MAX_LENGTH = 200;

export interface TemplateUsage {
  templateId: string;
  planCount: number;
}

export interface TemplateInUse {
  id: string;
  name: string;
  planCount: number;
}

/**
 * Templates that a KPI plan was built from (ADR-040). They cannot be deleted, because the
 * plan keeps pointing at them; the rest of the selection can go.
 */
export function findTemplatesInUse(
  templates: ReadonlyArray<{ id: string; name: string }>,
  usage: readonly TemplateUsage[],
): TemplateInUse[] {
  const counts = new Map(
    usage.map((row) => [row.templateId.toLowerCase(), Number(row.planCount)] as const),
  );

  return templates.flatMap((template) => {
    const planCount = counts.get(template.id.toLowerCase()) ?? 0;

    return planCount > 0 ? [{ id: template.id, name: template.name, planCount }] : [];
  });
}

const COPY_SUFFIX_PATTERN = / \((\d+)\)$/;

/** "MÜDÜR KPI 01 (3)" and "MÜDÜR KPI 01" share the base name "MÜDÜR KPI 01". */
export function copyNameBase(name: string): string {
  return name.replace(COPY_SUFFIX_PATTERN, '');
}

/**
 * Language-neutral copy name: the base name plus the next free " (n)" suffix, starting
 * at 2. `existingNames` are the names that already start with the base; the base is
 * shortened when needed so the result still fits the column.
 */
export function nextCopyName(sourceName: string, existingNames: readonly string[]): string {
  const base = copyNameBase(sourceName);
  const highest = existingNames.reduce((max, name) => {
    const match = COPY_SUFFIX_PATTERN.exec(name);
    const number = match?.[1] ? Number(match[1]) : 1;
    // Case-insensitive like the column's collation, so "müdür kpi 01 (4)" counts too.
    const sameBase = copyNameBase(name).localeCompare(base, undefined, { sensitivity: 'accent' });
    return sameBase === 0 ? Math.max(max, number) : max;
  }, 1);
  const suffix = ` (${highest + 1})`;

  return `${base.slice(0, TEMPLATE_NAME_MAX_LENGTH - suffix.length)}${suffix}`;
}
