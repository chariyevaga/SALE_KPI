import type { Locale } from './translations';

const LOCALE_TAGS: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
  tk: 'tk-TM',
};

export function formatDateTime(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

/** A calendar day (`YYYY-MM-DD`), formatted in UTC so no time zone moves it to another day. */
export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], options).format(value);
}

/** The name of a month (1–12), e.g. "Mart" or "Mar"; for charts and month lists. */
export function formatMonthName(
  month: number,
  locale: Locale,
  width: 'long' | 'short' = 'long',
): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: width, timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, month - 1, 1)),
  );
}

/** A month (`YYYY-MM`) as people say it, e.g. "Eylül 2026"; in UTC so it never shifts. */
export function formatMonth(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}-01T00:00:00Z`));
}

/** A calendar day in a few characters, e.g. "21 Eyl"; for chart axes. */
export function formatShortDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}
