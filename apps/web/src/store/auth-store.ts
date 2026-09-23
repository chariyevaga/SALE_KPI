import { create } from 'zustand';

import { tokenStore } from '../lib/token-store';
import type { AuthResponse, EmployeeResponse } from '../types/api';

/** 'expired' means the tokens ran out or were revoked, so the login page explains why. */
export type SessionEndReason = 'logout' | 'expired';

interface AuthState {
  employee: EmployeeResponse | null;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  setSession: (auth: AuthResponse, rememberMe: boolean) => void;
  setEmployee: (employee: EmployeeResponse) => void;
  clearSession: (reason?: SessionEndReason) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employee: null,
  isAuthenticated: tokenStore.get() !== null,
  sessionExpired: false,
  setSession: (auth, rememberMe) => {
    tokenStore.set({
      accessToken: auth.accessToken,
      expiresAt: Date.parse(auth.refreshTokenExpiresAt),
      persistent: rememberMe,
      refreshToken: auth.refreshToken,
    });
    set({ employee: auth.employee, isAuthenticated: true, sessionExpired: false });
  },
  setEmployee: (employee) => set({ employee }),
  clearSession: (reason = 'logout') => {
    // Flipped before clearing storage so the subscription below sees this as a handled sign-out.
    set({ employee: null, isAuthenticated: false, sessionExpired: reason === 'expired' });
    tokenStore.clear();
  },
}));

// Tokens can also disappear outside the store: a failed refresh, an expiry the store never saw,
// or a sign-out in another tab. Those all have to end the session in the UI as well.
tokenStore.subscribe(() => {
  if (useAuthStore.getState().isAuthenticated && tokenStore.get() === null) {
    useAuthStore.setState({ employee: null, isAuthenticated: false, sessionExpired: true });
  }
});
