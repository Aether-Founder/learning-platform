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
  // Example for future languages:
  // { code: 'fr', nativeName: 'Français' },
  // { code: 'de', nativeName: 'Deutsch' },
];

export type Language = (typeof LANGUAGE_REGISTRY)[number]['code'];

/** Languages selectable in the UI (all registered languages are candidates). */
export const LANGUAGES: readonly Language[] = LANGUAGE_REGISTRY.map((lang) => lang.code);

export const DEFAULT_LANGUAGE: Language = 'nl';

export const STORAGE_KEY = 'aether_language';
