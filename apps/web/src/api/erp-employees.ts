import { apiFetch } from '../lib/api-client';
import type { ErpEmployeeOption } from '../types/api';

/** `search` matches the Tiger code and name, case- and accent-insensitively. */
export function listErpEmployees(search = ''): Promise<ErpEmployeeOption[]> {
  const query = search ? `?${new URLSearchParams({ search }).toString()}` : '';

  return apiFetch<ErpEmployeeOption[]>(`/erp-employees${query}`);
}
