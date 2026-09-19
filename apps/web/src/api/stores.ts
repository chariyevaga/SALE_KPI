import { apiFetch } from '../lib/api-client';
import type { StoreOption } from '../types/api';

/** `search` matches the Tiger store number and name. */
export function listStores(search = ''): Promise<StoreOption[]> {
  const query = search ? `?${new URLSearchParams({ search }).toString()}` : '';

  return apiFetch<StoreOption[]>(`/stores${query}`);
}
