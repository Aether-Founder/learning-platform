import { describe, it, expect } from 'vitest';
import {
  fisherYatesShuffle,
  getPromptAndAnswer,
  filterPlayableTerms,
  daysUntilExam,
  prioritizeTermsForExam,
} from '@/lib/learning-platform/term-filters';
import { defaultStudySettings } from '@/lib/learning-platform/defaults';
import type { Term } from '@/types/learning-platform';

function makeTerm(overrides: Partial<Term>): Term {
  return {
    id: `term-${Math.random()}`,
    term: 'term',
    definition: 'definition',
    isStarred: false,
    masteryStatus: 'unstudied',
    consecutiveCorrectCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('term-filters', () => {
  describe('fisherYatesShuffle', () => {
    it('does not mutate the input array', () => {
      const input = [1, 2, 3, 4, 5];
      const result = fisherYatesShuffle(input);
      expect(input).toEqual([1, 2, 3, 4, 5]);
      expect(result).toHaveLength(5);
      expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('getPromptAndAnswer', () => {
    const term = makeTerm({ term: 'front', definition: 'back' });
    it('returns term -> definition by default', () => {
      expect(getPromptAndAnswer(term, 'term-to-definition')).toEqual({
        prompt: 'front',
        answer: 'back',
      });
    });
    it('reverses for definition-to-term', () => {
      expect(getPromptAndAnswer(term, 'definition-to-term')).toEqual({
        prompt: 'back',
        answer: 'front',
      });
    });
  });

  describe('filterPlayableTerms', () => {
    const past = new Date(Date.now() - 86400000);
    const future = new Date(Date.now() + 86400000);
    const terms = [
      makeTerm({ id: 'new1', reviewCount: 0 }),
      makeTerm({ id: 'new2', reviewCount: 0 }),
      makeTerm({ id: 'due1', reviewCount: 3, nextReviewAt: past }),
      makeTerm({ id: 'future1', reviewCount: 3, nextReviewAt: future }),
      makeTerm({ id: 'suspended1', reviewCount: 3, nextReviewAt: past, suspended: true }),
      makeTerm({ id: 'starred1', isStarred: true, reviewCount: 1, nextReviewAt: past }),
    ];

    it('respects selectedLearningSetIds', () => {
      const selected = [makeTerm({ id: 'sel', learningSetId: 'ls-1', reviewCount: 0 })];
      const result = filterPlayableTerms([...terms, ...selected], {
        ...defaultStudySettings,
        selectedLearningSetIds: ['ls-1'],
        reviewMode: 'mix',
      });
      expect(result.every((t) => t.learningSetId === 'ls-1')).toBe(true);
    });

    it('filters by starred only', () => {
      const result = filterPlayableTerms(terms, {
        ...defaultStudySettings,
        studyStarredOnly: true,
      });
      expect(result.every((t) => t.isStarred)).toBe(true);
    });

    it('filters by due review mode', () => {
      const result = filterPlayableTerms(terms, {
        ...defaultStudySettings,
        reviewMode: 'due',
      });
      const ids = result.map((t) => t.id);
      expect(ids).toContain('due1');
      expect(ids).not.toContain('future1');
      expect(ids).not.toContain('suspended1');
    });

    it('filters new terms in new mode', () => {
      const result = filterPlayableTerms(terms, { ...defaultStudySettings, reviewMode: 'new' });
      expect(result.every((t) => (t.reviewCount ?? 0) === 0)).toBe(true);
    });

    it('applies roundLength limit', () => {
      const many = Array.from({ length: 10 }, (_, i) =>
        makeTerm({ id: `m${i}`, reviewCount: 0 })
      );
      const result = filterPlayableTerms(many, { ...defaultStudySettings, roundLength: 3 });
      expect(result).toHaveLength(3);
    });
  });

  describe('daysUntilExam', () => {
    it('returns null without an exam date', () => {
      expect(daysUntilExam(undefined)).toBeNull();
    });
    it('returns positive days for a future exam', () => {
      const exam = new Date();
      exam.setDate(exam.getDate() + 2);
      expect(daysUntilExam(exam)).toBe(2);
    });
  });

  describe('prioritizeTermsForExam', () => {
    it('returns terms unchanged when exam is far away', () => {
      const terms = [makeTerm({ masteryStatus: 'mastered' }), makeTerm({ masteryStatus: 'review' })];
      const exam = new Date(Date.now() + 10 * 86400000);
      expect(prioritizeTermsForExam(terms, exam)).toHaveLength(2);
    });
    it('keeps terms when exam is null', () => {
      const terms = [makeTerm({ masteryStatus: 'mastered' })];
      expect(prioritizeTermsForExam(terms, undefined)).toHaveLength(1);
    });
    it('puts unmastered before mastered for near exam', () => {
      const unmastered = makeTerm({ id: 'u', masteryStatus: 'learning' });
      const mastered = makeTerm({ id: 'm', masteryStatus: 'mastered' });
      const exam = new Date(Date.now() + 1 * 86400000);
      const result = prioritizeTermsForExam([mastered, unmastered], exam);
      expect(result[0].id).toBe('u');
    });
  });
});
