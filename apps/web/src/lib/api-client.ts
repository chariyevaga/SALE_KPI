import { getDeviceId } from './device-id';
import { tokenStore } from './token-store';
import type { ApiErrorBody, AuthResponse } from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(`HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

async function refreshTokens(): Promise<boolean> {
  const stored = tokenStore.get();

  if (!stored) {
    return false;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: stored.refreshToken, deviceId: getDeviceId() }),
    });
  } catch {
    // A network blip is not an expired session; keep the tokens so a later attempt can succeed.
    return false;
  }

  if (!response.ok) {
    // The refresh token is expired, rotated away or revoked: the session is over.
    tokenStore.clear();
    return false;
  }

  const auth = (await response.json()) as AuthResponse;
  // Rotation renews the lifetime too, which is what slides a short session's window forward.
  tokenStore.set({
    accessToken: auth.accessToken,
    expiresAt: Date.parse(auth.refreshTokenExpiresAt),
    persistent: stored.persistent,
    refreshToken: auth.refreshToken,
  });

  return true;
}

/** Rotates the token pair, collapsing concurrent callers onto a single in-flight request. */
export function ensureFreshSession(): Promise<boolean> {
  refreshPromise ??= refreshTokens().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const stored = tokenStore.get();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (stored && !options.skipAuth) {
    headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };

  let response = await fetch(`${API_BASE_URL}${path}`, requestInit);

  if (response.status === 401 && stored && !options.skipAuth) {
    const refreshed = await ensureFreshSession();

    if (refreshed) {
      const retryStored = tokenStore.get();
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...requestInit,
        headers: { ...headers, Authorization: `Bearer ${retryStored?.accessToken ?? ''}` },
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204 || response.status === 202) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiFetchBlob(path: string): Promise<Blob> {
  const stored = tokenStore.get();
  const headers: Record<string, string> = {};

  if (stored) {
    headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (response.status === 401 && stored) {
    const refreshed = await ensureFreshSession();

    if (refreshed) {
      const retryStored = tokenStore.get();
      response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { Authorization: `Bearer ${retryStored?.accessToken ?? ''}` },
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  return response.blob();
}

export async function apiUpload<T>(path: string, file: Blob, fieldName = 'file'): Promise<T> {
  const stored = tokenStore.get();
  const headers: Record<string, string> = {};

  if (stored) {
    headers.Authorization = `Bearer ${stored.accessToken}`;
  }

  const formData = new FormData();
  formData.append(fieldName, file);

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 && stored) {
    const refreshed = await ensureFreshSession();

    if (refreshed) {
      const retryStored = tokenStore.get();
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${retryStored?.accessToken ?? ''}` },
        body: formData,
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };
