import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserAnalytics,
  getAggregatedAnalytics,
  getSubjectAnalytics,
} from '@/lib/analytics-aggregation';
import { createTestUser } from '@/test-utils/auth';
import { createStudySet, addStudyCard } from '@/lib/studysets';
import { createHomework } from '@/lib/homework';
import { updateStreak } from '@/lib/streaks';
import { resetDatabase } from '@/test-utils/db';

describe('analytics-aggregation', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'analytics@test.local' });
    userId = user.user.id;
  });

  it('returns zeroed analytics for a new user', async () => {
    const analytics = await getUserAnalytics(userId);
    expect(analytics.userId).toBe(userId);
    expect(analytics.totalCardsStudied).toBe(0);
    expect(analytics.totalStudySets).toBe(0);
    expect(analytics.totalHomeworkCompleted).toBe(0);
    expect(analytics.totalHomeworkPending).toBe(0);
    expect(analytics.totalTestsCompleted).toBe(0);
    expect(analytics.weeklyActivity).toHaveLength(7);
  });

  it('reflects study sets and homework', async () => {
    const set = createStudySet(userId, 'Wiskunde');
    addStudyCard(set.id, 'a', 'b');
    addStudyCard(set.id, 'c', 'd');
    await createHomework(
      userId,
      'Huiswerk',
      undefined,
      'Wiskunde',
      new Date(),
      'high',
      undefined,
      undefined,
      undefined
    );

    const analytics = await getUserAnalytics(userId);
    expect(analytics.totalStudySets).toBe(1);
    expect(analytics.totalCardsStudied).toBe(2);
    expect(analytics.totalHomeworkPending).toBe(1);
    expect(analytics.subjectBreakdown).toHaveLength(1);
    expect(analytics.subjectBreakdown[0].cardsStudied).toBe(2);
  });

  it('includes streak data and achievements', async () => {
    await updateStreak(userId, new Date());
    const analytics = await getUserAnalytics(userId);
    expect(analytics.currentStreak).toBe(1);
    expect(analytics.longestStreak).toBe(1);
    expect(analytics.achievementsUnlocked).toBe(0);
  });

  it('returns placeholder aggregated analytics', async () => {
    const agg = await getAggregatedAnalytics('week');
    expect(agg).toHaveProperty('totalUsers');
    expect(agg).toHaveProperty('activeUsers');
    expect(agg.totalUsers).toBe(0);
  });

  it('returns subject analytics', async () => {
    const set = createStudySet(userId, 'Natuurkunde');
    addStudyCard(set.id, 'x', 'y');
    const subjects = await getSubjectAnalytics(userId);
    expect(subjects).toHaveLength(1);
    expect(subjects[0].subject).toBe('Natuurkunde');
    expect(subjects[0].cardsStudied).toBe(1);
    expect(subjects[0]).toHaveProperty('accuracy');
    expect(subjects[0]).toHaveProperty('timeSpent');
  });
});
