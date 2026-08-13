import { describe, it, expect, afterEach, vi } from 'vitest';
import { detectLanguageFromLocation } from '@/lib/i18n-location';

function stubTimeZone(timeZone: string | undefined) {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone }),
  } as unknown as Intl.DateTimeFormat);
}

function stubNavigatorLanguages(languages: string[]) {
  vi.stubGlobal('navigator', { languages });
}

describe('detectLanguageFromLocation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('maps Dutch and Belgian time zones to Dutch', () => {
    stubNavigatorLanguages([]);
    stubTimeZone('Europe/Amsterdam');
    expect(detectLanguageFromLocation()).toBe('nl');
    stubTimeZone('Europe/Brussels');
    expect(detectLanguageFromLocation()).toBe('nl');
  });

  it('maps other time zones to English', () => {
    stubNavigatorLanguages(['en-US']);
    stubTimeZone('America/New_York');
    expect(detectLanguageFromLocation()).toBe('en');
  });

  it('uses the navigator region as a secondary signal', () => {
    stubTimeZone('Europe/Berlin');
    stubNavigatorLanguages(['de-DE', 'nl-BE']);
    expect(detectLanguageFromLocation()).toBe('nl');
  });

  it('ignores languages without a region', () => {
    stubTimeZone('Europe/Berlin');
    stubNavigatorLanguages(['nl', 'de']);
    expect(detectLanguageFromLocation()).toBe('en');
  });

  it('falls back to English without any signal', () => {
    stubTimeZone(undefined);
    stubNavigatorLanguages([]);
    expect(detectLanguageFromLocation()).toBe('en');
  });

  it('falls back to English when detection throws', () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('unavailable');
    });
    expect(detectLanguageFromLocation()).toBe('en');
  });

  it('returns English on the server where there is no window', () => {
    vi.stubGlobal('window', undefined);
    expect(detectLanguageFromLocation()).toBe('en');
  });
});
