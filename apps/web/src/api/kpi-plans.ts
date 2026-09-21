import { apiFetch } from '../lib/api-client';
import type {
  KpiPeriod,
  KpiPeriodListResponse,
  KpiPlan,
  KpiPlanCopyResult,
  KpiPlanListResponse,
  KpiPlanRecommendationsResponse,
  KpiPlanSummary,
  SaveKpiTargetsInput,
} from '../types/api';

const PERIODS_PAGE_SIZE = 24;
const PLANS_PAGE_SIZE = 20;

export function listKpiPeriods(): Promise<KpiPeriodListResponse> {
  return apiFetch<KpiPeriodListResponse>(`/kpi-periods?page=1&limit=${PERIODS_PAGE_SIZE}`);
}

/** Returns the month's period, opening it when it does not exist yet. */
export function ensureKpiPeriod(year: number, month: number): Promise<KpiPeriod> {
  return apiFetch<KpiPeriod>('/kpi-periods', { method: 'POST', body: { year, month } });
}

export function closeKpiPeriod(id: string): Promise<KpiPeriod> {
  return apiFetch<KpiPeriod>(`/kpi-periods/${id}/close`, { method: 'POST', body: {} });
}

export interface KpiPlanListQuery {
  search?: string;
  templateId?: string;
}

export function listKpiPlans(
  periodId: string,
  page: number,
  query: KpiPlanListQuery = {},
): Promise<KpiPlanListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(PLANS_PAGE_SIZE) });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return apiFetch<KpiPlanListResponse>(`/kpi-periods/${periodId}/assignments?${params.toString()}`);
}

export function assignKpiTemplate(
  periodId: string,
  templateId: string,
  employeeIds: string[],
): Promise<KpiPlanSummary[]> {
  return apiFetch<KpiPlanSummary[]>(`/kpi-periods/${periodId}/assignments`, {
    method: 'POST',
    body: { templateId, employeeIds },
  });
}

/** Copies another period's plans with their targets into this one. */
export function copyKpiPlans(periodId: string, sourcePeriodId: string): Promise<KpiPlanCopyResult> {
  return apiFetch<KpiPlanCopyResult>(`/kpi-periods/${periodId}/copy-assignments`, {
    method: 'POST',
    body: { sourcePeriodId },
  });
}

export function getKpiPlan(id: string): Promise<KpiPlan> {
  return apiFetch<KpiPlan>(`/kpi-assignments/${id}`);
}

export function getKpiPlanRecommendations(id: string): Promise<KpiPlanRecommendationsResponse> {
  return apiFetch<KpiPlanRecommendationsResponse>(`/kpi-assignments/${id}/recommendations`);
}

export function saveKpiTargets(id: string, input: SaveKpiTargetsInput): Promise<KpiPlan> {
  return apiFetch<KpiPlan>(`/kpi-assignments/${id}/targets`, { method: 'PUT', body: input });
}

export function deleteKpiPlan(id: string): Promise<void> {
  return apiFetch<void>(`/kpi-assignments/${id}`, { method: 'DELETE' });
}

/** The signed-in employee's own plan; without a month the newest one. */
export function getMyKpiPlan(month?: { year: number; month: number }): Promise<{
  plan: KpiPlan | null;
}> {
  const params = month ? `?year=${String(month.year)}&month=${String(month.month)}` : '';

  return apiFetch<{ plan: KpiPlan | null }>(`/kpi-assignments/me${params}`);
}
