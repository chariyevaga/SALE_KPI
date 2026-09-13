import { create } from 'zustand';

import { tokenStore } from '../lib/token-store';
import type { AuthResponse, EmployeeResponse } from '../types/api';

interface AuthState {
  employee: EmployeeResponse | null;
  isAuthenticated: boolean;
  setSession: (auth: AuthResponse) => void;
  setEmployee: (employee: EmployeeResponse) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employee: null,
  isAuthenticated: tokenStore.get() !== null,
  setSession: (auth) => {
    tokenStore.set({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
    set({ employee: auth.employee, isAuthenticated: true });
  },
  setEmployee: (employee) => set({ employee }),
  clearSession: () => {
    tokenStore.clear();
    set({ employee: null, isAuthenticated: false });
  },
}));
