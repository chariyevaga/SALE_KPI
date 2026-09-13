import { apiFetch } from '../lib/api-client';
import { getDeviceId } from '../lib/device-id';
import type { AuthResponse, EmployeeResponse } from '../types/api';

export interface LoginInput {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: {
      username: input.username,
      password: input.password,
      rememberMe: input.rememberMe ?? false,
      deviceId: getDeviceId(),
      deviceName: navigator.userAgent.slice(0, 255),
    },
  });
}

export function fetchCurrentEmployee(): Promise<EmployeeResponse> {
  return apiFetch<EmployeeResponse>('/auth/me');
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiFetch<void>('/auth/password', { method: 'PATCH', body: input });
}

export interface DeviceSessionResponse {
  id: string;
  deviceId: string;
  deviceName: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  rememberMe: boolean;
}

export function listDevices(): Promise<DeviceSessionResponse[]> {
  return apiFetch<DeviceSessionResponse[]>('/auth/devices');
}

export function revokeDevice(id: string): Promise<void> {
  return apiFetch<void>(`/auth/devices/${id}`, { method: 'DELETE' });
}

export function logoutAll(): Promise<void> {
  return apiFetch<void>('/auth/logout-all', { method: 'POST' });
}
