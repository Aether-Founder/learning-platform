import { describe, it, expect } from 'vitest';
import { normalizeAndDeduplicateCards } from '@/lib/learning-platform/card-normalization';

describe('card-normalization', () => {
  it('normalizes front/back from term/definition', () => {
    const result = normalizeAndDeduplicateCards([{ term: '  a  ', definition: ' b ' }]);
    expect(result[0].front).toBe('a');
    expect(result[0].back).toBe('b');
    expect(result[0].cardType).toBe('basic');
    expect(result[0].tags).toEqual([]);
  });

  it('flags duplicate fronts case-insensitively', () => {
    const result = normalizeAndDeduplicateCards([
      { term: 'Hello', definition: 'x' },
      { term: 'hello', definition: 'y' },
      { term: 'other', definition: 'z' },
    ]);
    expect(result[0].isDuplicate).toBe(false);
    expect(result[1].isDuplicate).toBe(true);
    expect(result[2].isDuplicate).toBe(false);
  });

  it('preserves optional fields', () => {
    const result = normalizeAndDeduplicateCards([
      {
        term: 'a',
        definition: 'b',
        image: 'img.png',
        audio: 'aud.mp3',
        tags: ['one'],
        clozeText: 'text',
        cardType: 'cloze',
      },
    ]);
    expect(result[0]).toMatchObject({
      imageUrl: 'img.png',
      audioUrl: 'aud.mp3',
      tags: ['one'],
      clozeText: 'text',
      cardType: 'cloze',
    });
  });

  it('handles empty cards without crashing', () => {
    const result = normalizeAndDeduplicateCards([{}]);
    expect(result[0].front).toBe('');
    expect(result[0].back).toBe('');
  });
});
