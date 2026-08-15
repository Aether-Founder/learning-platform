import { describe, it, expect } from 'vitest';
import { DUTCH_TEXTBOOKS, getTextbookChapters } from '@/lib/curriculum/textbooks';

describe('curriculum/textbooks', () => {
  describe('DUTCH_TEXTBOOKS', () => {
    it('has unique textbook ids', () => {
      const ids = DUTCH_TEXTBOOKS.map((textbook) => textbook.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('describes every textbook with levels and chapters', () => {
      for (const textbook of DUTCH_TEXTBOOKS) {
        expect(textbook.level.length).toBeGreaterThan(0);
        expect(textbook.chapters.length).toBeGreaterThan(0);
        expect(textbook.isbn).toMatch(/^\d{13}$/);
        expect(textbook.chapters.every((chapter) => chapter.topics.length > 0)).toBe(true);
      }
    });

    it('has unique chapter ids per textbook', () => {
      for (const textbook of DUTCH_TEXTBOOKS) {
        const ids = textbook.chapters.map((chapter) => chapter.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });
  });

  describe('getTextbookChapters', () => {
    it('returns the chapters of a known textbook', () => {
      const textbook = DUTCH_TEXTBOOKS[0]!;
      expect(getTextbookChapters(textbook.id)).toEqual(textbook.chapters);
    });

    it('returns an empty list for an unknown textbook', () => {
      expect(getTextbookChapters('bestaat-niet')).toEqual([]);
    });
  });
});
