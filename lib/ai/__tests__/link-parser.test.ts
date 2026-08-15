import { describe, it, expect } from 'vitest';
import { parseLinks } from '@/lib/ai/link-parser';

describe('parseLinks', () => {
  it('extracts wiki-link targets', () => {
    expect(parseLinks('See [[Biologie]] and [[Scheikunde]].')).toEqual(['Biologie', 'Scheikunde']);
  });

  it('drops the display text after a pipe', () => {
    expect(parseLinks('[[Biologie|hoofdstuk 1]]')).toEqual(['Biologie']);
    expect(parseLinks('[[Biologie|]]')).toEqual(['Biologie']);
  });

  it('trims whitespace around targets', () => {
    expect(parseLinks('[[  Biologie  ]]')).toEqual(['Biologie']);
  });

  it('ignores empty targets', () => {
    expect(parseLinks('[[]] [[   ]]')).toEqual([]);
  });

  it('keeps duplicates in document order', () => {
    expect(parseLinks('[[A]] [[B]] [[A]]')).toEqual(['A', 'B', 'A']);
  });

  it('returns nothing for markdown without wiki links', () => {
    expect(parseLinks('Plain text with [a link](https://example.com) and [brackets].')).toEqual([]);
    expect(parseLinks('')).toEqual([]);
  });

  it('finds links spread across multiple lines', () => {
    expect(parseLinks('# Titel\n\n- [[Een]]\n- [[Twee|2]]\n')).toEqual(['Een', 'Twee']);
  });
});
