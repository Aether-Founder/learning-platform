import { describe, it, expect, vi } from 'vitest';
import {
  createId,
  pickDistractors,
  buildMcqQuestion,
  buildWrittenQuestion,
  buildTrueFalseQuestion,
  buildTestQuestions,
  learnQuestionTypeForTerm,
  buildLearnQuestion,
} from '@/lib/learning-platform/question-generator';
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

const terms: Term[] = [
  makeTerm({ id: 't1', term: 'alpha', definition: 'definition-alpha' }),
  makeTerm({ id: 't2', term: 'beta', definition: 'definition-beta' }),
  makeTerm({ id: 't3', term: 'gamma', definition: 'definition-gamma' }),
  makeTerm({ id: 't4', term: 'delta', definition: 'definition-delta' }),
];

describe('question-generator', () => {
  describe('createId', () => {
    it('prefixes generated ids', () => {
      expect(createId('q').startsWith('q-')).toBe(true);
    });
    it('generates unique ids', () => {
      expect(createId('q')).not.toBe(createId('q'));
    });
  });

  describe('pickDistractors', () => {
    it('excludes the correct answer and current term', () => {
      const distractors = pickDistractors(terms, terms[0], 3, 'definition');
      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain('definition-alpha');
    });
    it('returns fewer when pool is small', () => {
      const small = terms.slice(0, 2);
      const distractors = pickDistractors(small, small[0], 3, 'definition');
      expect(distractors.length).toBeLessThanOrEqual(1);
    });
  });

  describe('buildMcqQuestion', () => {
    it('builds a multiple-choice question with 4 options', () => {
      const q = buildMcqQuestion(terms[0], terms, defaultStudySettings);
      expect(q.type).toBe('multiple-choice');
      expect(q.prompt).toBe('alpha');
      expect(q.correctAnswer).toBe('definition-alpha');
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain('definition-alpha');
    });
  });

  describe('buildWrittenQuestion', () => {
    it('builds a written question', () => {
      const q = buildWrittenQuestion(terms[0], defaultStudySettings);
      expect(q.type).toBe('written');
      expect(q.prompt).toBe('alpha');
      expect(q.correctAnswer).toBe('definition-alpha');
    });
  });

  describe('buildTrueFalseQuestion', () => {
    it('builds a true-false question', () => {
      const q = buildTrueFalseQuestion(terms[0], terms, defaultStudySettings);
      expect(q.type).toBe('true-false');
      expect(q.options).toEqual(['True', 'False']);
      expect(['True', 'False']).toContain(q.correctAnswer);
    });
    it('forces false statements when requested', () => {
      const q = buildTrueFalseQuestion(terms[0], terms, defaultStudySettings, true);
      expect(q.correctAnswer).toBe('False');
    });
  });

  describe('buildTestQuestions', () => {
    it('produces one question per term', () => {
      const questions = buildTestQuestions(terms, terms, defaultStudySettings);
      expect(questions).toHaveLength(4);
    });
    it('falls back to multiple-choice when enabled types empty', () => {
      const questions = buildTestQuestions(terms, terms, {
        ...defaultStudySettings,
        enabledQuestionTypes: [],
      });
      expect(questions.every((q) => q.type === 'multiple-choice')).toBe(true);
    });
  });

  describe('learnQuestionTypeForTerm', () => {
    it('uses written after two consecutive correct', () => {
      expect(learnQuestionTypeForTerm(terms[0], 2)).toBe('written');
      expect(learnQuestionTypeForTerm(terms[0], 1)).toBe('multiple-choice');
    });
  });

  describe('buildLearnQuestion', () => {
    it('delegates to written/multiple choice by streak', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(buildLearnQuestion(terms[0], terms, defaultStudySettings, 0).type).toBe(
        'multiple-choice'
      );
      expect(buildLearnQuestion(terms[0], terms, defaultStudySettings, 2).type).toBe('written');
      vi.restoreAllMocks();
    });
  });
});
