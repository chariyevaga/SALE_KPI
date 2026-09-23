/** Mirrors the API's `BULK_MAX_IDS`; larger selections go out as several requests. */
export const BULK_MAX_IDS = 100;

export function chunkIds(ids: readonly string[], size = BULK_MAX_IDS): string[][] {
  const chunks: string[][] = [];

  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }

  return chunks;
}

/** Result of the last bulk action, shown in the BulkActionBar. */
export interface BulkNotice {
  tone: 'success' | 'error';
  text: string;
}

/** The bar shows while rows are selected or a result is on screen; pages hide the FAB then. */
export function isBulkBarVisible(count: number, notice: BulkNotice | null): boolean {
  return count > 0 || notice !== null;
}
