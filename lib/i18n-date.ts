import { enUS, nl, type Locale } from 'date-fns/locale';
import type { Language } from './i18n-config';

const LOCALES: Partial<Record<Language, Locale>> = {
  nl,
  en: enUS,
};

let current: Language = 'nl';

/** Register the active language for date formatting (kept in sync by I18nProvider). */
export function setDateFormatLocale(language: Language): void {
  current = language;
}

export function getDateFormatLocale(): Locale {
  return LOCALES[current] ?? enUS;
}

export function getDateLocaleLabel(language: Language): Locale {
  return LOCALES[language] ?? enUS;
}
