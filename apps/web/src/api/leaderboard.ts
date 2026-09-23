import { apiFetch } from '../lib/api-client';
import type { LeaderboardResponse } from '../types/api';

export interface LeaderboardQuery {
  periodId?: string | undefined;
  templateId?: string | undefined;
}

/** Plans of a period ranked by total score; without a period, this month's (ADR-047). */
export function getLeaderboard(query: LeaderboardQuery = {}): Promise<LeaderboardResponse> {
  const params = new URLSearchParams();

  if (query.periodId) {
    params.set('periodId', query.periodId);
  }

  if (query.templateId) {
    params.set('templateId', query.templateId);
  }

  const search = params.toString();

  return apiFetch<LeaderboardResponse>(`/leaderboard${search ? `?${search}` : ''}`);
}
