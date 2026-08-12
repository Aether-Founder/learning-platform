import { getStreakData } from './streaks';
import { getUserAchievements } from './achievements';
import { getStudySetsByUserId } from './studysets';
import { getHomeworkByUserId } from './homework';
import { getStudyPlansByUser } from './studyplans';

export interface UserAnalytics {
  userId: string;
  totalStudyTime: number;
  totalCardsStudied: number;
  totalTestsCompleted: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalStudySets: number;
  totalHomeworkCompleted: number;
  totalHomeworkPending: number;
  totalStudyPlans: number;
  achievementsUnlocked: number;
  weeklyActivity: Array<{ date: string; activity: number }>;
  subjectBreakdown: Array<{ subject: string; cardsStudied: number; timeSpent: number }>;
}

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  const streakData = await getStreakData(userId);
  const achievements = await getUserAchievements(userId);
  const studySets = await getStudySetsByUserId(userId);
  const homework = await getHomeworkByUserId(userId);
  const studyPlans = await getStudyPlansByUser(userId);

  const achievementsUnlocked = achievements.filter((a) => a.unlockedAt).length;
  const totalStudySets = studySets.length;
  const totalHomeworkCompleted = homework.filter((h) => h.status === 'completed').length;
  const totalHomeworkPending = homework.filter((h) => h.status !== 'completed').length;
  const totalStudyPlans = studyPlans.length;

  // Calculate total cards from all study sets
  let totalCardsStudied = 0;
  studySets.forEach((set) => {
    if (set.cards) {
      totalCardsStudied += set.cards.length;
    }
  });

  // Generate weekly activity (last 7 days)
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    weeklyActivity.push({
      date: date.toISOString().split('T')[0],
      activity: Math.floor(Math.random() * 10), // Placeholder - would come from actual analytics data
    });
  }

  // Generate subject breakdown (using study set titles as categories)
  const subjectBreakdown: Array<{ subject: string; cardsStudied: number; timeSpent: number }> = [];
  studySets.forEach((set) => {
    const cards = set.cards?.length || 0;
    subjectBreakdown.push({
      subject: set.title,
      cardsStudied: cards,
      timeSpent: cards * 2, // Placeholder: 2 minutes per card
    });
  });

  return {
    userId,
    totalStudyTime: totalCardsStudied * 2, // Placeholder: 2 minutes per card
    totalCardsStudied,
    totalTestsCompleted: 0, // Would come from actual test data
    averageScore: 0, // Would come from actual test data
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    totalStudySets,
    totalHomeworkCompleted,
    totalHomeworkPending,
    totalStudyPlans,
    achievementsUnlocked,
    weeklyActivity,
    subjectBreakdown,
  };
}

export async function getAggregatedAnalytics(
  _timeRange: 'day' | 'week' | 'month' | 'year' = 'week'
): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalStudyTime: number;
  totalCardsStudied: number;
  totalTestsCompleted: number;
  averageSessionDuration: number;
}> {
  // Placeholder aggregation - would query actual analytics data
  return {
    totalUsers: 0,
    activeUsers: 0,
    totalStudyTime: 0,
    totalCardsStudied: 0,
    totalTestsCompleted: 0,
    averageSessionDuration: 0,
  };
}

export async function getSubjectAnalytics(userId: string): Promise<
  Array<{
    subject: string;
    cardsStudied: number;
    accuracy: number;
    timeSpent: number;
    lastStudied: Date | null;
  }>
> {
  const studySets = await getStudySetsByUserId(userId);

  const subjectAnalytics = studySets.map((set) => {
    const cardsStudied = set.cards?.length || 0;

    return {
      subject: set.title,
      cardsStudied,
      accuracy: 0, // Would come from actual study data
      timeSpent: cardsStudied * 2, // Placeholder
      lastStudied: new Date(set.updatedAt),
    };
  });

  return subjectAnalytics;
}

export async function getStudySessionAnalytics(
  userId: string,
  _limit: number = 10
): Promise<
  Array<{
    id: string;
    studySetId: string;
    studySetName: string;
    mode: string;
    cardsStudied: number;
    accuracy: number;
    duration: number;
    timestamp: Date;
  }>
> {
  // Placeholder - would query actual session data
  return [];
}
