import { describe, it, expect, afterEach } from 'vitest';
import { enUS, nl } from 'date-fns/locale';
import { getDateFormatLocale, getDateLocaleLabel, setDateFormatLocale } from '@/lib/i18n-date';

describe('i18n-date', () => {
  afterEach(() => {
    setDateFormatLocale('nl');
  });

  it('defaults to the Dutch locale', () => {
    expect(getDateFormatLocale()).toBe(nl);
  });

  it('follows the registered language', () => {
    setDateFormatLocale('en');
    expect(getDateFormatLocale()).toBe(enUS);
    setDateFormatLocale('nl');
    expect(getDateFormatLocale()).toBe(nl);
  });

  it('falls back to en-US for an unmapped language', () => {
    setDateFormatLocale('fr');
    expect(getDateFormatLocale()).toBe(enUS);
  });

  it('looks up a locale without changing the active one', () => {
    expect(getDateLocaleLabel('en')).toBe(enUS);
    expect(getDateLocaleLabel('de')).toBe(enUS);
    expect(getDateFormatLocale()).toBe(nl);
  });
});
