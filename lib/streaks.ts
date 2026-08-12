import db from './db';

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date | null;
  streakHistory: Array<{ date: string; streak: number }>;
}

export async function getStreakData(userId: string): Promise<StreakData> {
  const stmt = db.prepare('SELECT * FROM streak_data WHERE user_id = ?');
  const row = stmt.get(userId) as any;

  if (!row) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      streakHistory: [],
    };
  }

  return {
    userId: row.user_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastStudyDate: row.last_study_date ? new Date(row.last_study_date) : null,
    streakHistory: row.streak_history ? JSON.parse(row.streak_history) : [],
  };
}

export async function updateStreak(userId: string, studyDate: Date): Promise<StreakData> {
  const currentData = await getStreakData(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studyDay = new Date(studyDate);
  studyDay.setHours(0, 0, 0, 0);

  let newStreak = currentData.currentStreak;
  let newLongestStreak = currentData.longestStreak;

  if (currentData.lastStudyDate) {
    const lastStudyDay = new Date(currentData.lastStudyDate);
    lastStudyDay.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (studyDay.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 0) {
      // Same day, no change
      return currentData;
    } else if (dayDiff === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (dayDiff > 1) {
      // Streak broken
      newStreak = 1;
    }
  } else {
    // First study
    newStreak = 1;
  }

  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  const streakHistory = currentData.streakHistory || [];
  streakHistory.push({ date: studyDay.toISOString().split('T')[0], streak: newStreak });

  // Keep only last 365 days of history
  if (streakHistory.length > 365) {
    streakHistory.splice(0, streakHistory.length - 365);
  }

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO streak_data (user_id, current_streak, longest_streak, last_study_date, streak_history)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    userId,
    newStreak,
    newLongestStreak,
    studyDay.toISOString(),
    JSON.stringify(streakHistory)
  );

  return {
    userId,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastStudyDate: studyDay,
    streakHistory,
  };
}

export async function resetStreak(userId: string): Promise<StreakData> {
  const currentData = await getStreakData(userId);

  const stmt = db.prepare(`
    UPDATE streak_data
    SET current_streak = 0
    WHERE user_id = ?
  `);

  stmt.run(userId);

  return {
    ...currentData,
    currentStreak: 0,
  };
}

export async function checkStreakStatus(
  userId: string
): Promise<{ isActive: boolean; daysSinceLastStudy: number }> {
  const data = await getStreakData(userId);

  if (!data.lastStudyDate) {
    return { isActive: false, daysSinceLastStudy: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStudyDay = new Date(data.lastStudyDate);
  lastStudyDay.setHours(0, 0, 0, 0);

  const daysSinceLastStudy = Math.floor(
    (today.getTime() - lastStudyDay.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isActive = daysSinceLastStudy <= 1;

  return { isActive, daysSinceLastStudy };
}
