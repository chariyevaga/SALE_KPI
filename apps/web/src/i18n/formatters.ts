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

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale]).format(value);
}
