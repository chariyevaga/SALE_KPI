import { apiFetch } from '../lib/api-client';
import type {
  SaveStoreVisitorCountInput,
  StoreVisitorCount,
  StoreVisitorCountListResponse,
} from '../types/api';

const PAGE_SIZE = 20;

export interface StoreVisitorCountQuery {
  storeId?: number;
  from?: string;
  to?: string;
}

/** Daily counts newest first (ADR-043). */
export function listStoreVisitorCounts(
  page: number,
  query: StoreVisitorCountQuery = {},
): Promise<StoreVisitorCountListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return apiFetch<StoreVisitorCountListResponse>(`/store-visitor-counts?${params.toString()}`);
}

/** Writes a store's count for a day; entering the same day again replaces the number. */
export function saveStoreVisitorCount(
  input: SaveStoreVisitorCountInput,
): Promise<StoreVisitorCount> {
  return apiFetch<StoreVisitorCount>('/store-visitor-counts', { method: 'PUT', body: input });
}

export function deleteStoreVisitorCount(id: string): Promise<void> {
  return apiFetch<void>(`/store-visitor-counts/${id}`, { method: 'DELETE' });
}
