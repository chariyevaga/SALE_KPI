import { apiFetch, apiFetchBlob, apiUpload } from '../lib/api-client';
import type { Locale } from '../i18n/translations';
import type {
  SaveStoreVisitorCountInput,
  StoreVisitorCountImportResult,
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

export interface VisitorCountTemplateQuery {
  from: string;
  to: string;
  storeId?: number;
  lang: Locale;
}

/** The Excel template (ADR-055): a row per store and day, saved counts filled in. */
export function downloadVisitorCountTemplate(query: VisitorCountTemplateQuery): Promise<Blob> {
  const params = new URLSearchParams({ from: query.from, to: query.to, lang: query.lang });

  if (query.storeId !== undefined) {
    params.set('storeId', String(query.storeId));
  }

  return apiFetchBlob(`/store-visitor-counts/template?${params.toString()}`);
}

/** Writes the counts of a filled-in template; nothing is written if any row is wrong. */
export function importVisitorCounts(file: File): Promise<StoreVisitorCountImportResult> {
  return apiUpload<StoreVisitorCountImportResult>('/store-visitor-counts/import', file);
}
