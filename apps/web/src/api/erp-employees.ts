import { apiFetch } from '../lib/api-client';
import type { ErpEmployeeOption } from '../types/api';

export function listErpEmployees(): Promise<ErpEmployeeOption[]> {
  return apiFetch<ErpEmployeeOption[]>('/erp-employees');
}
