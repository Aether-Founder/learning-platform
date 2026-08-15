import { describe, it, expect } from 'vitest';
import { flashcardSections } from '@/lib/flashcard-data';

describe('flashcard-data', () => {
  it('has unique section ids', () => {
    const ids = flashcardSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has globally unique question ids', () => {
    const ids = flashcardSections.flatMap((section) =>
      section.questions.map((question) => question.id)
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every section a title, timestamp and questions', () => {
    for (const section of flashcardSections) {
      expect(section.title.trim()).not.toBe('');
      expect(section.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      expect(section.questions.length).toBeGreaterThan(0);
    }
  });

  it('numbers the questions sequentially inside each section', () => {
    for (const section of flashcardSections) {
      const numbers = section.questions.map((question) => question.number);
      expect(numbers).toEqual(
        section.questions.map((_, index) => String(index + 1).padStart(2, '0'))
      );
      expect(section.questions.every((question) => question.text.trim() !== '')).toBe(true);
    }
  });
});
