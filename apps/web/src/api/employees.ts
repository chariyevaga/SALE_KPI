import type { DeviceSessionResponse } from './auth';
import { apiFetch } from '../lib/api-client';
import { chunkIds } from '../lib/bulk';
import type {
  BulkUpdateResponse,
  CreateEmployeeInput,
  EmployeeListResponse,
  EmployeeResponse,
  UpdateEmployeeInput,
} from '../types/api';

const EMPLOYEES_PAGE_SIZE = 20;

export type EmployeeSortField = 'firstname' | 'lastname' | 'username' | 'email' | 'createdAt';

export interface EmployeeListQuery {
  search?: string;
  isActive?: boolean;
  fullAccess?: boolean;
  hasErpLink?: boolean;
  hasAvatar?: boolean;
  sort?: EmployeeSortField;
  order?: 'asc' | 'desc';
}

export function listEmployees(page: number, query: EmployeeListQuery = {}): Promise<EmployeeListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(EMPLOYEES_PAGE_SIZE) });

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  return apiFetch<EmployeeListResponse>(`/employees?${params.toString()}`);
}

export function getEmployee(id: string): Promise<EmployeeResponse> {
  return apiFetch<EmployeeResponse>(`/employees/${id}`);
}

export function createEmployee(input: CreateEmployeeInput): Promise<EmployeeResponse> {
  return apiFetch<EmployeeResponse>('/employees', { method: 'POST', body: input });
}

export function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeResponse> {
  return apiFetch<EmployeeResponse>(`/employees/${id}`, { method: 'PATCH', body: input });
}

/** Self-service profile update; works without admin rights. */
export function updateOwnProfile(input: { avatarId?: string | null }): Promise<EmployeeResponse> {
  return apiFetch<EmployeeResponse>('/employees/me', { method: 'PATCH', body: input });
}

export function deactivateEmployee(id: string): Promise<void> {
  return apiFetch<void>(`/employees/${id}`, { method: 'DELETE' });
}

/** Bulk (de)activation from the list screen (ADR-035); `updated` counts rows that changed. */
export async function bulkSetEmployeesActive(
  ids: string[],
  isActive: boolean,
): Promise<BulkUpdateResponse> {
  let updated = 0;

  for (const chunk of chunkIds(ids)) {
    const result = await apiFetch<BulkUpdateResponse>('/employees/bulk-status', {
      method: 'POST',
      body: { ids: chunk, isActive },
    });
    updated += result.updated;
  }

  return { updated };
}

export function listEmployeeSessions(employeeId: string): Promise<DeviceSessionResponse[]> {
  return apiFetch<DeviceSessionResponse[]>(`/employees/${employeeId}/sessions`);
}

export function revokeEmployeeSession(employeeId: string, sessionId: string): Promise<void> {
  return apiFetch<void>(`/employees/${employeeId}/sessions/${sessionId}`, { method: 'DELETE' });
}

export function revokeAllEmployeeSessions(employeeId: string): Promise<void> {
  return apiFetch<void>(`/employees/${employeeId}/sessions/revoke-all`, { method: 'POST' });
}
