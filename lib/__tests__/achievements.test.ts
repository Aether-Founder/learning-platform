import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAchievementDefinitions,
  getUserAchievements,
  getAchievementProgress,
  updateAchievementProgress,
  checkAndUnlockAchievements,
  getUnlockedAchievements,
  getLockedAchievements,
} from '@/lib/achievements';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('achievements', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'achieve@test.local' });
    userId = user.user.id;
  });

  it('lists all definitions', async () => {
    const defs = await getAchievementDefinitions();
    expect(defs.length).toBeGreaterThan(5);
    expect(defs[0]).toHaveProperty('id');
    expect(defs[0]).toHaveProperty('maxProgress');
    expect(defs[0]).toHaveProperty('category');
  });

  it('returns empty achievements for a new user', async () => {
    expect(await getUserAchievements(userId)).toEqual([]);
    expect(await getUnlockedAchievements(userId)).toEqual([]);
    expect(await getLockedAchievements(userId)).toEqual([]);
  });

  it('updates progress and unlocks when threshold reached', async () => {
    const result = await updateAchievementProgress(userId, 'first_study', 1);
    expect(result.newlyUnlocked).toBe(true);
    expect(result.achievement.unlockedAt).not.toBeNull();

    const again = await updateAchievementProgress(userId, 'first_study', 1);
    expect(again.newlyUnlocked).toBe(false);
  });

  it('throws for unknown achievement definitions', async () => {
    await expect(updateAchievementProgress(userId, 'does_not_exist', 1)).rejects.toThrow();
  });

  it('caps progress at maxProgress once unlocked', async () => {
    await updateAchievementProgress(userId, 'cards_100', 100);
    const result = await updateAchievementProgress(userId, 'cards_100', 50);
    expect(result.achievement.progress).toBe(100);
    expect(result.newlyUnlocked).toBe(false);
  });

  it('queries progress by id', async () => {
    await updateAchievementProgress(userId, 'streak_3', 1);
    const progress = await getAchievementProgress(userId, 'streak_3');
    expect(progress).not.toBeNull();
    expect(progress!.achievementId).toBe('streak_3');
    expect(progress!.progress).toBe(1);
    expect(await getAchievementProgress(userId, 'unknown')).toBeNull();
  });

  it('checkAndUnlockAchievements unlocks on study events', async () => {
    const unlocked = await checkAndUnlockAchievements(userId, 'study', { cardsStudied: 100 });
    const ids = unlocked.map((a) => a.achievementId);
    expect(ids).toContain('first_study');
    expect(ids).toContain('cards_100');
  });

  it('checkAndUnlockAchievements unlocks on streak events', async () => {
    const unlocked = await checkAndUnlockAchievements(userId, 'streak', { streak: 7 });
    const ids = unlocked.map((a) => a.achievementId);
    expect(ids).toContain('streak_3');
    expect(ids).toContain('streak_7');
    expect(ids).not.toContain('streak_30');
  });

  it('checkAndUnlockAchievements unlocks on perfect test', async () => {
    const unlocked = await checkAndUnlockAchievements(userId, 'test', { perfectScore: true });
    const ids = unlocked.map((a) => a.achievementId);
    expect(ids).toContain('perfect_test');
  });

  it('checkAndUnlockAchievements unlocks on class and set events', async () => {
    const classUnlocked = await checkAndUnlockAchievements(userId, 'class', { joinedClass: true });
    const setUnlocked = await checkAndUnlockAchievements(userId, 'set', { createdSet: true });
    expect(classUnlocked.map((a) => a.achievementId)).toContain('join_class');
    expect(setUnlocked.map((a) => a.achievementId)).toContain('create_set');
  });
});
