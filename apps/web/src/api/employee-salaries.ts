import { apiFetch } from '../lib/api-client';
import type { EmployeeSalary, EmployeeSalaryList, SaveEmployeeSalaryInput } from '../types/api';

/** An employee's salaries and the one in force this month (full_access only, ADR-048). */
export function listEmployeeSalaries(employeeId: string): Promise<EmployeeSalaryList> {
  return apiFetch<EmployeeSalaryList>(`/employees/${employeeId}/salaries`);
}

export function createEmployeeSalary(
  employeeId: string,
  input: SaveEmployeeSalaryInput,
): Promise<EmployeeSalary> {
  return apiFetch<EmployeeSalary>(`/employees/${employeeId}/salaries`, {
    method: 'POST',
    body: input,
  });
}

export function updateEmployeeSalary(
  id: string,
  input: SaveEmployeeSalaryInput,
): Promise<EmployeeSalary> {
  return apiFetch<EmployeeSalary>(`/employee-salaries/${id}`, { method: 'PUT', body: input });
}

export function deleteEmployeeSalary(id: string): Promise<void> {
  return apiFetch<void>(`/employee-salaries/${id}`, { method: 'DELETE' });
}
