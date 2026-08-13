import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_REGISTRY,
  STORAGE_KEY,
} from '@/lib/i18n-config';

describe('i18n-config', () => {
  it('derives the language codes from the registry', () => {
    expect(LANGUAGES).toEqual(LANGUAGE_REGISTRY.map((language) => language.code));
  });

  it('registers unique codes with a native name', () => {
    expect(new Set(LANGUAGES).size).toBe(LANGUAGES.length);
    expect(LANGUAGE_REGISTRY.every((language) => language.nativeName.length > 0)).toBe(true);
  });

  it('defaults to a registered language', () => {
    expect(LANGUAGES).toContain(DEFAULT_LANGUAGE);
    expect(DEFAULT_LANGUAGE).toBe('nl');
  });

  it('exposes the storage key used by the language switcher', () => {
    expect(STORAGE_KEY).toBe('aether_language');
  });
});
