/**
 * Leaderboard ordering (ADR-047). Plans are ranked by their total score, highest first;
 * equal scores share a rank and the next one skips ("1, 2, 2, 4"). Plans never scored
 * have no rank and come last. Within a tie the order is by name, so it does not jump
 * around between two loads.
 */

export interface RankInput {
  totalScore: number | null;
  employee: { firstname: string; lastname: string };
}

export type Ranked<T> = T & { rank: number | null };

export function rankEntries<T extends RankInput>(entries: readonly T[]): Ranked<T>[] {
  const sorted = [...entries].sort(compareEntries);
  let previousScore: number | null = null;
  let previousRank = 0;

  return sorted.map((entry, index) => {
    if (entry.totalScore === null) {
      return { ...entry, rank: null };
    }

    const rank = entry.totalScore === previousScore ? previousRank : index + 1;

    previousScore = entry.totalScore;
    previousRank = rank;

    return { ...entry, rank };
  });
}

function compareEntries(left: RankInput, right: RankInput): number {
  if (left.totalScore !== right.totalScore) {
    if (left.totalScore === null) {
      return 1;
    }

    if (right.totalScore === null) {
      return -1;
    }

    return right.totalScore - left.totalScore;
  }

  return (
    left.employee.firstname.localeCompare(right.employee.firstname) ||
    left.employee.lastname.localeCompare(right.employee.lastname)
  );
}
