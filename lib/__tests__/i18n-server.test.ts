import { describe, it, expect } from 'vitest';
import { getServerT } from '@/lib/i18n-server';

describe('getServerT', () => {
  it('resolves keys from the requested locale file', async () => {
    const nl = await getServerT('nl');
    const en = await getServerT('en');
    expect(nl('a11y_comfort')).toBe('Leescomfort');
    expect(en('a11y_comfort')).toBe('Reading comfort');
  });

  it('defaults to Dutch', async () => {
    const t = await getServerT();
    expect(t('a11y_comfort')).toBe('Leescomfort');
  });

  it('falls back to the default language for an unsupported one', async () => {
    const t = await getServerT('fr' as 'nl');
    expect(t('a11y_comfort')).toBe('Leescomfort');
  });

  it('uses the fallback text for an unknown key', async () => {
    const t = await getServerT('nl');
    expect(t('does_not_exist', 'Fallback')).toBe('Fallback');
  });

  it('returns the key itself when there is no fallback', async () => {
    const t = await getServerT('nl');
    expect(t('does_not_exist')).toBe('does_not_exist');
  });

  it('interpolates named parameters', async () => {
    const t = await getServerT('nl');
    expect(t('greeting', 'Hallo {name}, je hebt {count} kaarten', { name: 'Sam', count: 3 })).toBe(
      'Hallo Sam, je hebt 3 kaarten'
    );
  });

  it('leaves placeholders without a matching parameter untouched', async () => {
    const t = await getServerT('nl');
    expect(t('greeting', 'Hallo {name}', { other: 'x' })).toBe('Hallo {name}');
  });
});
