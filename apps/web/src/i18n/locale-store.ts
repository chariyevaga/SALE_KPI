import { create } from 'zustand';

import { SUPPORTED_LOCALES, translations, type Locale } from './translations';

const STORAGE_KEY = 'rkpi.locale';

function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored && isSupportedLocale(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access failures and fall through to browser detection.
  }

  const browserLanguage = navigator.language.slice(0, 2).toLowerCase();

  return isSupportedLocale(browserLanguage) ? browserLanguage : 'tr';
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}

const initialLocale = detectInitialLocale();
applyDocumentLocale(initialLocale);

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initialLocale,
  setLocale: (locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Private-mode/blocked storage: the choice just won't survive a reload.
    }

    applyDocumentLocale(locale);
    set({ locale });
  },
}));

type Path<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Path<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Path<(typeof translations)['tr']>;
export type TranslationParams = Record<string, number | string>;
export type Translate = (key: TranslationKey, params?: TranslationParams) => string;

function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((accumulator, segment) => {
    if (accumulator && typeof accumulator === 'object' && segment in accumulator) {
      return (accumulator as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);

  function t(key: TranslationKey, params?: TranslationParams): string {
    const value = getByPath(translations[locale], key) ?? getByPath(translations.tr, key);

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value;
    }

    return value.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
      Object.hasOwn(params, name) ? String(params[name]) : placeholder,
    );
  }

  return { t, locale, setLocale };
}
