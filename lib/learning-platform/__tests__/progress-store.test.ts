import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeMasteryStatus,
  applyTermProgress,
  mergeTermsWithProgress,
  loadProgressStore,
  saveProgressForSet,
  saveSession,
  resetProgressForSet,
  loadSettings,
  saveSettings,
  startSession,
} from '@/lib/learning-platform/progress-store';
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

describe('progress-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('applyTermProgress', () => {
    it('returns new progress on first attempt', () => {
      const progress = applyTermProgress(undefined, 'term-1', true, false);
      expect(progress.termId).toBe('term-1');
      expect(progress.totalAttempts).toBe(1);
      expect(progress.correctAttempts).toBe(1);
    });
    it('accumulates across attempts', () => {
      let progress = applyTermProgress(undefined, 'term-1', true, false);
      progress = applyTermProgress(progress, 'term-1', true, false);
      expect(progress.totalAttempts).toBe(2);
      expect(progress.correctAttempts).toBe(2);
      expect(progress.consecutiveCorrectCount).toBe(2);
    });
    it('resets consecutive streak on wrong answer', () => {
      let progress = applyTermProgress(undefined, 'term-1', true, false);
      progress = applyTermProgress(progress, 'term-1', false, false);
      expect(progress.consecutiveCorrectCount).toBe(0);
      expect(progress.lapseCount).toBe(1);
    });
    it('uses written grade for written answers', () => {
      const progress = applyTermProgress(undefined, 'term-1', true, true);
      expect(progress.lastGrade).toBe('good');
    });
    it('supports fsrs algorithm', () => {
      const progress = applyTermProgress(undefined, 'term-1', true, false, 'fsrs');
      expect(progress.intervalDays).toBeGreaterThan(0);
    });
  });

  describe('computeMasteryStatus', () => {
    it('returns unstudied for undefined', () => {
      expect(computeMasteryStatus(undefined)).toBe('unstudied');
    });
  });

  describe('mergeTermsWithProgress', () => {
    it('merges progress into terms', () => {
      const terms = [makeTerm({ id: 't1' })];
      const progress = {
        t1: {
          ...applyTermProgress(undefined, 't1', true, false),
          reviewCount: 3,
          intervalDays: 4,
        },
      };
      const merged = mergeTermsWithProgress(terms, progress);
      expect(merged[0].reviewCount).toBe(3);
      expect(merged[0].intervalDays).toBe(4);
    });
  });

  describe('persistence', () => {
    it('round-trips progress through storage', () => {
      const progress = applyTermProgress(undefined, 't1', true, false);
      saveProgressForSet('set-1', { t1: progress });
      const loaded = loadProgressStore('set-1');
      expect(loaded.progress.t1.totalAttempts).toBe(1);
    });

    it('returns empty store when nothing saved', () => {
      const store = loadProgressStore('set-unknown');
      expect(store.progress).toEqual({});
      expect(store.sessions).toEqual([]);
    });

    it('resetProgressForSet clears progress', () => {
      saveProgressForSet('set-1', { t1: applyTermProgress(undefined, 't1', true, false) });
      resetProgressForSet('set-1');
      expect(loadProgressStore('set-1').progress).toEqual({});
    });

    it('saves sessions capped at 50', () => {
      const session = startSession('set-1', 'learn', defaultStudySettings, 5);
      for (let i = 0; i < 55; i += 1) {
        saveSession('set-1', { ...session, id: `s-${i}` });
      }
      expect(loadProgressStore('set-1').sessions).toHaveLength(50);
    });
  });

  describe('settings', () => {
    it('round-trips settings', () => {
      saveSettings('set-1', { ...defaultStudySettings, roundLength: 10 });
      const loaded = loadSettings('set-1');
      expect(loaded?.roundLength).toBe(10);
    });
    it('returns null when no settings saved', () => {
      expect(loadSettings('set-none')).toBeNull();
    });
  });

  describe('startSession', () => {
    it('creates a session with defaults', () => {
      const session = startSession('set-1', 'test', defaultStudySettings, 10);
      expect(session.studySetId).toBe('set-1');
      expect(session.mode).toBe('test');
      expect(session.totalQuestions).toBe(10);
      expect(session.correctAnswers).toBe(0);
      expect(session.termResults).toEqual([]);
      expect(session.startTime).toBeInstanceOf(Date);
    });
  });
});
