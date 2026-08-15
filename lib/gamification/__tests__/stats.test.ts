import { describe, it, expect } from 'vitest';
import {
  DEFAULT_GAMIFICATION_STATS,
  awardXp,
  getXpReward,
  levelForXp,
  xpForLevel,
  xpProgress,
  type GamificationStats,
} from '@/lib/gamification/stats';

describe('gamification stats', () => {
  describe('xpForLevel', () => {
    it('requires no xp for the first level', () => {
      expect(xpForLevel(1)).toBe(0);
      expect(xpForLevel(0)).toBe(0);
    });

    it('grows the requirement for each level', () => {
      expect(xpForLevel(2)).toBe(300);
      expect(xpForLevel(3)).toBe(700);
      expect(xpForLevel(4)).toBeGreaterThan(xpForLevel(3));
    });
  });

  describe('levelForXp', () => {
    it('is the inverse of xpForLevel at the thresholds', () => {
      expect(levelForXp(0)).toBe(1);
      expect(levelForXp(299)).toBe(1);
      expect(levelForXp(300)).toBe(2);
      expect(levelForXp(700)).toBe(3);
      expect(levelForXp(xpForLevel(6))).toBe(6);
    });
  });

  describe('xpProgress', () => {
    it('reports progress within the current level', () => {
      const progress = xpProgress({ xp: 450 });
      expect(progress.level).toBe(2);
      expect(progress.current).toBe(150);
      expect(progress.required).toBe(400);
      expect(progress.percentage).toBe(38);
    });

    it('is at zero percent right after levelling up', () => {
      const progress = xpProgress({ xp: xpForLevel(3) });
      expect(progress.level).toBe(3);
      expect(progress.current).toBe(0);
      expect(progress.percentage).toBe(0);
    });
  });

  describe('awardXp', () => {
    const base: GamificationStats = { ...DEFAULT_GAMIFICATION_STATS, xp: 0, level: 1 };

    it('adds the reward and recomputes the level', () => {
      const stats = awardXp({ ...base, xp: 295 }, 'review_card');
      expect(stats.xp).toBe(305);
      expect(stats.level).toBe(2);
    });

    it('counts reviewed cards only for review events', () => {
      expect(awardXp(base, 'review_card').cardsReviewed).toBe(base.cardsReviewed + 1);
      expect(awardXp(base, 'complete_session').cardsReviewed).toBe(base.cardsReviewed);
    });

    it('counts perfect sessions only for perfect session events', () => {
      expect(awardXp(base, 'perfect_session').perfectSessions).toBe(base.perfectSessions + 1);
      expect(awardXp(base, 'keep_streak').perfectSessions).toBe(base.perfectSessions);
    });

    it('does not mutate the stats it is given', () => {
      const stats = { ...base };
      awardXp(stats, 'finish_deck');
      expect(stats.xp).toBe(0);
    });
  });

  describe('getXpReward', () => {
    it('exposes the reward table', () => {
      expect(getXpReward('review_card')).toBe(10);
      expect(getXpReward('complete_session')).toBe(50);
      expect(getXpReward('perfect_session')).toBe(100);
      expect(getXpReward('keep_streak')).toBe(25);
      expect(getXpReward('finish_deck')).toBe(150);
    });
  });

  describe('DEFAULT_GAMIFICATION_STATS', () => {
    it('is internally consistent', () => {
      expect(DEFAULT_GAMIFICATION_STATS.level).toBe(levelForXp(DEFAULT_GAMIFICATION_STATS.xp));
      expect(DEFAULT_GAMIFICATION_STATS.longestStreak).toBeGreaterThanOrEqual(
        DEFAULT_GAMIFICATION_STATS.currentStreak
      );
    });
  });
});
