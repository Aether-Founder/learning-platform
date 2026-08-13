import { describe, it, expect } from 'vitest';
import { getSectionTitle, getSectionTitles } from '@/lib/section-title';

describe('getSectionTitles', () => {
  it('prefers the titles array', () => {
    expect(getSectionTitles({ titles: ['A', 'B'], chapterTitles: ['C'], title: 'D' })).toEqual([
      'A',
      'B',
    ]);
  });

  it('falls back to chapterTitles when titles is empty', () => {
    expect(getSectionTitles({ titles: [], chapterTitles: ['C'], title: 'D' })).toEqual(['C']);
  });

  it('accepts a title array', () => {
    expect(getSectionTitles({ title: ['A', 'B'] })).toEqual(['A', 'B']);
  });

  it('wraps a single string title', () => {
    expect(getSectionTitles({ title: 'A' })).toEqual(['A']);
  });

  it('trims titles and drops blank ones', () => {
    expect(getSectionTitles({ titles: ['  A  ', '   ', 'B'] })).toEqual(['A', 'B']);
  });

  it('returns an empty list when there is no title', () => {
    expect(getSectionTitles({})).toEqual([]);
    expect(getSectionTitles({ title: '' })).toEqual([]);
  });
});

describe('getSectionTitle', () => {
  it('joins multiple titles with a plus', () => {
    expect(getSectionTitle({ titles: ['A', 'B'] })).toBe('A + B');
  });

  it('returns the single title as-is', () => {
    expect(getSectionTitle({ title: 'A' })).toBe('A');
  });

  it('uses the default fallback when there is no title', () => {
    expect(getSectionTitle({})).toBe('Zonder titel');
  });

  it('uses a custom fallback when given', () => {
    expect(getSectionTitle({}, 'Untitled')).toBe('Untitled');
  });
});
