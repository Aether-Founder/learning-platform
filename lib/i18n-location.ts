import type { Language } from './i18n-config';
import { getErrorMessage } from './errors';
import { logger } from './logger';

const DUTCH_TIMEZONES: readonly string[] = ['Europe/Amsterdam', 'Europe/Brussels'];
const DUTCH_REGIONS: readonly string[] = ['NL', 'BE'];

/**
 * Detect the visitor's country from browser signals and map it to a language:
 * the Netherlands and Belgium get Dutch, every other country gets English.
 *
 * Uses the IANA time zone as the primary signal (no network call needed, works
 * offline) and the `navigator.language` region as a secondary hint.
 */
export function detectLanguageFromLocation(): Language {
  try {
    if (typeof window === 'undefined') {
      return 'en';
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && DUTCH_TIMEZONES.includes(timeZone)) {
      return 'nl';
    }

    const regions = navigator.languages?.length
      ? new Set(
          navigator.languages.map((locale) => locale.split('-')[1]?.toUpperCase()).filter(Boolean)
        )
      : new Set<string>();
    if (DUTCH_REGIONS.some((region) => regions.has(region))) {
      return 'nl';
    }

    return 'en';
  } catch (error) {
    logger.warn('Language detection failed, defaulting to English', {
      reason: getErrorMessage(error),
    });
    return 'en';
  }
}
