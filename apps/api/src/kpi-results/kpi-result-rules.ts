export { isCalculableKpi } from '../reports/kpi-report-checks.js';

/**
 * The score formula of docs/BUSINESS_RULES.md "Puan hesabı" (ADR-041):
 *
 *   raw      = actual / target * 100
 *   capped   = min(max(raw, 0), 100)
 *   weighted = capped * weight / 100
 *
 * The raw value is kept as it is, so management analysis can see achievement above 100,
 * while the score itself is capped at 100 and never goes below zero.
 */

/** Two decimals everywhere: the columns are decimal(9,2) and decimal(6,2). */
const SCORE_DECIMALS = 2;

export interface ScoreInput {
  targetValue: number | null;
  actualValue: number | null;
  weight: number;
}

export interface Score {
  rawAchievement: number | null;
  cappedAchievement: number | null;
  weightedScore: number | null;
}

/** A row without a target or without an actual value cannot be scored; it stays empty. */
export function scoreRow({ targetValue, actualValue, weight }: ScoreInput): Score {
  if (targetValue === null || targetValue === 0 || actualValue === null) {
    return { rawAchievement: null, cappedAchievement: null, weightedScore: null };
  }

  const raw = (actualValue / targetValue) * 100;
  const capped = Math.min(Math.max(raw, 0), 100);

  return {
    rawAchievement: round(raw),
    cappedAchievement: round(capped),
    weightedScore: round((capped * weight) / 100),
  };
}

export interface PlanScore {
  /** Sum of the weighted contributions of the rows that could be scored. */
  totalScore: number;
  scoredItemCount: number;
  itemCount: number;
}

/**
 * The plan's total. Rows that cannot be scored yet (no target, or a manual KPI nobody has
 * filled in) are left out of the sum and counted, so the screens can say "3/5".
 */
export function planScore(scores: readonly Score[]): PlanScore {
  const scored = scores.filter((score) => score.weightedScore !== null);

  return {
    totalScore: round(scored.reduce((total, score) => total + (score.weightedScore ?? 0), 0)),
    scoredItemCount: scored.length,
    itemCount: scores.length,
  };
}

function round(value: number): number {
  const factor = 10 ** SCORE_DECIMALS;

  return Math.round(value * factor) / factor;
}

/** What a stored or freshly built result row holds, as far as a change matters. */
export interface ComparableResult extends Score {
  assignmentItemId: string;
  targetValue: number | null;
  actualValue: number | null;
  source: string;
  weight: number;
}

/** `kpi_results` keeps four decimals (decimal(19,4)); Tiger sums can carry more. */
const STORED_VALUE_DECIMALS = 4;

/**
 * True when a new calculation would write exactly what is stored. The scheduled
 * recalculation (ADR-047) skips such plans, so the audit log only gains an entry when a
 * number really moved. Values are compared at the precision the columns store.
 */
export function sameResults(
  stored: readonly ComparableResult[],
  next: readonly ComparableResult[],
): boolean {
  if (stored.length !== next.length) {
    return false;
  }

  const byItem = new Map(stored.map((row) => [row.assignmentItemId.toLowerCase(), row]));

  return next.every((row) => {
    const previous = byItem.get(row.assignmentItemId.toLowerCase());

    return (
      previous !== undefined &&
      previous.source === row.source &&
      sameNumber(previous.targetValue, row.targetValue) &&
      sameNumber(previous.actualValue, row.actualValue) &&
      sameNumber(previous.weight, row.weight) &&
      sameNumber(previous.rawAchievement, row.rawAchievement) &&
      sameNumber(previous.cappedAchievement, row.cappedAchievement) &&
      sameNumber(previous.weightedScore, row.weightedScore)
    );
  });
}

function sameNumber(left: number | null, right: number | null): boolean {
  if (left === null || right === null) {
    return left === right;
  }

  const factor = 10 ** STORED_VALUE_DECIMALS;

  return Math.round(left * factor) === Math.round(right * factor);
}
