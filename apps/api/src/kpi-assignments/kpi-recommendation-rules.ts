/**
 * How the suggestions of several stores are combined into one plan row (docs/REPORTS.md).
 * Counts and money are added up. A rate such as the store conversion cannot be added: it is
 * averaged with each store's visitors as the weight, which is what pooling the receipts and
 * visitors of the stores would give when their rates are steady (ADR-057).
 */

export interface WeightedValue {
  value: number | null;
  weight: number;
}

/** The weighted mean of the values that exist; a plain mean when no store has a weight. */
export function weightedAverage(values: readonly WeightedValue[]): number | null {
  const present = values.filter(
    (entry): entry is { value: number; weight: number } => entry.value !== null,
  );

  if (present.length === 0) {
    return null;
  }

  const totalWeight = present.reduce((total, entry) => total + Math.max(entry.weight, 0), 0);

  if (totalWeight === 0) {
    return present.reduce((total, entry) => total + entry.value, 0) / present.length;
  }

  return (
    present.reduce((total, entry) => total + entry.value * Math.max(entry.weight, 0), 0) /
    totalWeight
  );
}
