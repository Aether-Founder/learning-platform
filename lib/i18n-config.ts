/**
 * Language registry — single source of truth for supported languages.
 *
 * To add a new language:
 *   1. Drop a `{code}.json` translation file into `public/locales/`.
 *   2. Add its code + native name below.
 *   3. (Optional) Add a date-fns locale mapping in `lib/i18n-date.ts`.
 * That's it — no other code changes are required.
 */

export interface LanguageMeta {
  code: string;
  /** Name shown in the language switcher, written in that language itself. */
  nativeName: string;
}

export const LANGUAGE_REGISTRY: readonly LanguageMeta[] = [
  { code: 'nl', nativeName: 'Nederlands' },
  { code: 'en', nativeName: 'English' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'zh', nativeName: '中文' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'es', nativeName: 'Español' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'pt', nativeName: 'Português' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'id', nativeName: 'Bahasa Indonesia' },
  { code: 'vi', nativeName: 'Tiếng Việt' },
  { code: 'th', nativeName: 'ไทย' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'uk', nativeName: 'Українська' },
];

export type Language = (typeof LANGUAGE_REGISTRY)[number]['code'];

/** Languages selectable in the UI (all registered languages are candidates). */
export const LANGUAGES: readonly Language[] = LANGUAGE_REGISTRY.map((lang) => lang.code);

export const DEFAULT_LANGUAGE: Language = 'nl';

export const STORAGE_KEY = 'aether_language';
