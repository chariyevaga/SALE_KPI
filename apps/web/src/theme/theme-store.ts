import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'rkpi.theme';

function resolvePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage access failures; fall back to system.
  }

  return 'system';
}

function applyTheme(preference: ThemePreference): void {
  const isDark =
    preference === 'dark' ||
    (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const initialPreference = resolvePreference();

if (typeof document !== 'undefined') {
  applyTheme(initialPreference);
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: initialPreference,
  setPreference: (preference) => {
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Private-mode/blocked storage: the choice just won't survive a reload.
    }

    applyTheme(preference);
    set({ preference });
  },
}));

if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (useThemeStore.getState().preference === 'system') {
        applyTheme('system');
      }
    });
}
