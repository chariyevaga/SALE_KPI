import type { LocalizedText } from '../types/api';
import type { Locale } from './translations';

/** Picks the selected language and falls back to Turkish, which the API always provides. */
export function pickLocalizedText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.tr;
}
