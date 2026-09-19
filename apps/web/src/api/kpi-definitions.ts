import { apiFetch } from '../lib/api-client';
import type { KpiDefinition } from '../types/api';

/** `search` matches the KPI code and its name in every language. */
export function listKpiDefinitions(search = ''): Promise<KpiDefinition[]> {
  const query = search ? `?${new URLSearchParams({ search }).toString()}` : '';

  return apiFetch<KpiDefinition[]>(`/kpi-definitions${query}`);
}
