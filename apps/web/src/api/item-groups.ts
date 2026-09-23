import { apiFetch } from '../lib/api-client';
import type { ItemGroupListResponse } from '../types/api';

/** Tiger item groups for item group KPIs; `search` matches the group code (ADR-045). */
export function listItemGroups(search = ''): Promise<ItemGroupListResponse> {
  const query = search ? `?${new URLSearchParams({ search }).toString()}` : '';

  return apiFetch<ItemGroupListResponse>(`/item-groups${query}`);
}
