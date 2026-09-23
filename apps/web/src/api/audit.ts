import { apiFetch } from '../lib/api-client';
import type { AuditedTable, AuditLogListResponse, RecordInfo } from '../types/api';

const HISTORY_PAGE_SIZE = 20;

/** Who created and last changed a record (full_access only, ADR-036). */
export function getRecordInfo(tableName: AuditedTable, recordId: string): Promise<RecordInfo> {
  return apiFetch<RecordInfo>(`/record-info/${tableName}/${recordId}`);
}

/** The record's change history, newest first. */
export function listRecordHistory(
  tableName: AuditedTable,
  recordId: string,
  page: number,
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams({
    tableName,
    recordId,
    page: String(page),
    limit: String(HISTORY_PAGE_SIZE),
  });

  return apiFetch<AuditLogListResponse>(`/audit-logs?${params.toString()}`);
}
