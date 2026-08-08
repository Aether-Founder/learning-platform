import { describe, it, expect, vi } from 'vitest';
import {
  defaultSrsProgress,
  gradeFromCorrectness,
  isDue,
  computeSrsStatus,
  scheduleReview,
  progressToTerm,
  reviewForecast,
} from '@/lib/learning-platform/srs';
import type { Term, UserTermProgress } from '@/types/learning-platform';

describe('srs', () => {
  describe('defaultSrsProgress', () => {
    it('creates unstudied progress with defaults', () => {
      const progress = defaultSrsProgress('term-1');
      expect(progress.termId).toBe('term-1');
      expect(progress.status).toBe('unstudied');
      expect(progress.totalAttempts).toBe(0);
      expect(progress.easeFactor).toBe(2.5);
      expect(progress.intervalDays).toBe(0);
      expect(progress.suspended).toBe(false);
      expect(progress.nextReviewAt).toBeInstanceOf(Date);
    });
  });

  describe('gradeFromCorrectness', () => {
    it('maps incorrect to again', () => {
      expect(gradeFromCorrectness(false, false)).toBe('again');
      expect(gradeFromCorrectness(false, true)).toBe('again');
    });
    it('maps correct written to good', () => {
      expect(gradeFromCorrectness(true, true)).toBe('good');
    });
    it('maps correct non-written to hard', () => {
      expect(gradeFromCorrectness(true, false)).toBe('hard');
    });
  });

  describe('isDue', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    it('returns false for undefined progress', () => {
      expect(isDue(undefined, now)).toBe(false);
    });
    it('returns false for suspended progress', () => {
      expect(isDue({ suspended: true }, now)).toBe(false);
    });
    it('returns false when buriedUntil is in the future', () => {
      expect(
        isDue({ suspended: false, buriedUntil: new Date('2026-02-01T00:00:00Z') }, now)
      ).toBe(false);
    });
    it('returns true when no nextReviewAt set', () => {
      expect(isDue({ suspended: false }, now)).toBe(true);
    });
    it('returns true when nextReviewAt is in the past', () => {
      expect(isDue({ suspended: false, nextReviewAt: new Date('2026-01-01T00:00:00Z') }, now)).toBe(
        true
      );
    });
    it('returns false when nextReviewAt is in the future', () => {
      expect(isDue({ suspended: false, nextReviewAt: new Date('2026-01-11T00:00:00Z') }, now)).toBe(
        false
      );
    });
  });

  describe('computeSrsStatus', () => {
    it('returns unstudied for missing or zero-attempt progress', () => {
      expect(computeSrsStatus(undefined)).toBe('unstudied');
      expect(computeSrsStatus(defaultSrsProgress('t'))).toBe('unstudied');
    });
    it('returns suspended when suspended', () => {
      const p = { ...defaultSrsProgress('t'), totalAttempts: 5, suspended: true };
      expect(computeSrsStatus(p)).toBe('suspended');
    });
    it('returns due when overdue and reviewed enough', () => {
      const p: UserTermProgress = {
        ...defaultSrsProgress('t'),
        totalAttempts: 5,
        reviewCount: 5,
        intervalDays: 10,
        correctAttempts: 5,
        nextReviewAt: new Date(Date.now() - 1000),
      };
      expect(computeSrsStatus(p)).toBe('due');
    });
    it('returns mastered for stable high-accuracy progress', () => {
      const p: UserTermProgress = {
        ...defaultSrsProgress('t'),
        totalAttempts: 10,
        reviewCount: 6,
        intervalDays: 20,
        correctAttempts: 9,
        nextReviewAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      expect(computeSrsStatus(p)).toBe('mastered');
    });
    it('returns review after two reviews', () => {
      const p: UserTermProgress = {
        ...defaultSrsProgress('t'),
        totalAttempts: 2,
        reviewCount: 2,
        correctAttempts: 2,
        intervalDays: 1,
        nextReviewAt: new Date(Date.now() + 1000 * 60 * 60),
      };
      expect(computeSrsStatus(p)).toBe('review');
    });
  });

  describe('scheduleReview', () => {
    it('schedules again after 10 minutes for again grade', () => {
      const p = defaultSrsProgress('t');
      const result = scheduleReview(p, 'again', 'sm2');
      expect(result.intervalDays).toBe(0);
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.lapseCount).toBe(1);
      expect(result.totalAttempts).toBe(1);
      expect(result.nextReviewAt.getTime()).toBeLessThanOrEqual(
        new Date(Date.now() + 10 * 60 * 1000).getTime()
      );
    });
    it('grows interval for good grade on sm2', () => {
      const p = { ...defaultSrsProgress('t'), intervalDays: 2, easeFactor: 2.5 };
      const result = scheduleReview(p, 'good', 'sm2');
      expect(result.intervalDays).toBeGreaterThan(2);
      expect(result.consecutiveCorrectCount).toBe(1);
      expect(result.reviewCount).toBe(1);
      expect(result.status).not.toBe('unstudied');
    });
    it('increases ease factor for easy and decreases for hard', () => {
      const p = { ...defaultSrsProgress('t'), intervalDays: 1, easeFactor: 2.5 };
      const easy = scheduleReview(p, 'easy', 'sm2');
      const hard = scheduleReview(p, 'hard', 'sm2');
      expect(easy.easeFactor).toBeGreaterThan(2.5);
      expect(hard.easeFactor).toBeLessThan(2.5);
    });
    it('handles fsrs algorithm without crashing', () => {
      const p = defaultSrsProgress('t');
      const result = scheduleReview(p, 'good', 'fsrs');
      expect(result.totalAttempts).toBe(1);
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
      expect(result.intervalDays).toBeGreaterThan(0);
    });
  });

  describe('progressToTerm', () => {
    it('fills in default fields without progress', () => {
      const term: Term = {
        id: 't1',
        term: 'front',
        definition: 'back',
        isStarred: false,
        masteryStatus: 'unstudied',
        consecutiveCorrectCount: 0,
        createdAt: new Date(),
      };
      const result = progressToTerm(term);
      expect(result.front).toBe('front');
      expect(result.back).toBe('back');
      expect(result.cardType).toBe('basic');
      expect(result.tags).toEqual([]);
    });
    it('overlays progress fields when provided', () => {
      const term: Term = {
        id: 't1',
        term: 'front',
        definition: 'back',
        isStarred: false,
        masteryStatus: 'unstudied',
        consecutiveCorrectCount: 0,
        createdAt: new Date(),
      };
      const progress = {
        ...defaultSrsProgress('t1'),
        totalAttempts: 3,
        correctAttempts: 3,
        reviewCount: 3,
        intervalDays: 2,
      };
      const result = progressToTerm(term, progress);
      expect(result.masteryStatus).toBe('learning');
      expect(result.intervalDays).toBe(2);
      expect(result.reviewCount).toBe(3);
    });
  });

  describe('reviewForecast', () => {
    it('produces day entries with correct counts', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-10T00:00:00Z'));
      const future = new Date('2026-01-12T00:00:00Z');
      const term: Term = {
        id: 't1',
        term: 'a',
        definition: 'b',
        isStarred: false,
        masteryStatus: 'unstudied',
        consecutiveCorrectCount: 0,
        nextReviewAt: future,
        createdAt: new Date(),
      };
      const forecast = reviewForecast([term], 7);
      expect(forecast).toHaveLength(7);
      expect(forecast[2].count).toBe(1);
      expect(forecast[0].count).toBe(0);
      vi.useRealTimers();
    });
  });
});
