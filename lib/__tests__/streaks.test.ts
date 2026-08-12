import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStreakData, updateStreak, resetStreak, checkStreakStatus } from '@/lib/streaks';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('streaks', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'streak@test.local' });
    userId = user.user.id;
  });

  it('returns empty defaults for a new user', async () => {
    const data = await getStreakData(userId);
    expect(data.currentStreak).toBe(0);
    expect(data.longestStreak).toBe(0);
    expect(data.lastStudyDate).toBeNull();
    expect(data.streakHistory).toEqual([]);
  });

  it('records the first study day', async () => {
    const data = await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    expect(data.currentStreak).toBe(1);
    expect(data.longestStreak).toBe(1);
    expect(data.streakHistory).toHaveLength(1);
  });

  it('increments streak on a consecutive day', async () => {
    await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    const data = await updateStreak(userId, new Date('2026-01-02T10:00:00Z'));
    expect(data.currentStreak).toBe(2);
    expect(data.longestStreak).toBe(2);
  });

  it('does not change streak on the same day', async () => {
    await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    const data = await updateStreak(userId, new Date('2026-01-01T18:00:00Z'));
    expect(data.currentStreak).toBe(1);
    expect(data.streakHistory).toHaveLength(1);
  });

  it('resets streak when a day is skipped', async () => {
    await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    await updateStreak(userId, new Date('2026-01-02T10:00:00Z'));
    const data = await updateStreak(userId, new Date('2026-01-05T10:00:00Z'));
    expect(data.currentStreak).toBe(1);
    expect(data.longestStreak).toBe(2);
  });

  it('resetStreak zeroes the current streak', async () => {
    await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    const data = await resetStreak(userId);
    expect(data.currentStreak).toBe(0);
  });

  it('checkStreakStatus reports inactive with no study data', async () => {
    const status = await checkStreakStatus(userId);
    expect(status.isActive).toBe(false);
    expect(status.daysSinceLastStudy).toBe(0);
  });

  it('checkStreakStatus reports active when studied today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    await updateStreak(userId, new Date('2026-01-01T10:00:00Z'));
    const status = await checkStreakStatus(userId);
    expect(status.isActive).toBe(true);
    vi.useRealTimers();
  });
});
