import db from "./db";

export interface Achievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date | null;
  progress: number;
  maxProgress: number;
  createdAt: Date;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxProgress: number;
  category: "streak" | "study" | "social" | "mastery";
}

const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  first_study: {
    id: "first_study",
    name: "Eerste Stap",
    description: "Voltooi je eerste studie sessie",
    icon: "🎯",
    maxProgress: 1,
    category: "study",
  },
  streak_3: {
    id: "streak_3",
    name: "Op Dreef",
    description: "Behaal een streak van 3 dagen",
    icon: "🔥",
    maxProgress: 3,
    category: "streak",
  },
  streak_7: {
    id: "streak_7",
    name: "Week Warrior",
    description: "Behaal een streak van 7 dagen",
    icon: "⚡",
    maxProgress: 7,
    category: "streak",
  },
  streak_30: {
    id: "streak_30",
    name: "Maand Meester",
    description: "Behaal een streak van 30 dagen",
    icon: "👑",
    maxProgress: 30,
    category: "streak",
  },
  cards_100: {
    id: "cards_100",
    name: "Kaarten Verzamelaar",
    description: "Studeer 100 kaarten",
    icon: "📚",
    maxProgress: 100,
    category: "study",
  },
  cards_1000: {
    id: "cards_1000",
    name: "Kaarten Expert",
    description: "Studeer 1000 kaarten",
    icon: "🎓",
    maxProgress: 1000,
    category: "study",
  },
  perfect_test: {
    id: "perfect_test",
    name: "Perfecte Score",
    description: "Haal 100% op een test",
    icon: "💯",
    maxProgress: 1,
    category: "mastery",
  },
  test_10: {
    id: "test_10",
    name: "Test Kampioen",
    description: "Voltooi 10 tests",
    icon: "🏆",
    maxProgress: 10,
    category: "mastery",
  },
  join_class: {
    id: "join_class",
    name: "Team Speler",
    description: "Sluit je aan bij een klas",
    icon: "👥",
    maxProgress: 1,
    category: "social",
  },
  create_set: {
    id: "create_set",
    name: "Content Creator",
    description: "Maak je eerste studeerset",
    icon: "✨",
    maxProgress: 1,
    category: "study",
  },
};

export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  return Object.values(ACHIEVEMENT_DEFINITIONS);
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const stmt = db.prepare("SELECT * FROM achievements WHERE user_id = ?");
  const rows = stmt.all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : null,
    progress: row.progress,
    maxProgress: row.max_progress,
    createdAt: new Date(row.created_at),
  }));
}

export async function getAchievementProgress(userId: string, achievementId: string): Promise<Achievement | null> {
  const stmt = db.prepare("SELECT * FROM achievements WHERE user_id = ? AND achievement_id = ?");
  const row = stmt.get(userId, achievementId) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at ? new Date(row.unlocked_at) : null,
    progress: row.progress,
    maxProgress: row.max_progress,
    createdAt: new Date(row.created_at),
  };
}

export async function updateAchievementProgress(
  userId: string,
  achievementId: string,
  increment: number
): Promise<{ achievement: Achievement; newlyUnlocked: boolean }> {
  const current = await getAchievementProgress(userId, achievementId);
  const definition = ACHIEVEMENT_DEFINITIONS[achievementId];
  
  if (!definition) {
    throw new Error(`Achievement definition not found: ${achievementId}`);
  }

  const now = new Date();
  let newProgress = current ? current.progress + increment : increment;
  let unlockedAt = current ? current.unlockedAt : null;
  let newlyUnlocked = false;

  if (newProgress >= definition.maxProgress && !unlockedAt) {
    unlockedAt = now;
    newlyUnlocked = true;
    newProgress = definition.maxProgress;
  }

  const id = current ? current.id : crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO achievements (id, user_id, achievement_id, unlocked_at, progress, max_progress, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    achievementId,
    unlockedAt ? unlockedAt.toISOString() : null,
    newProgress,
    definition.maxProgress,
    current ? current.createdAt.toISOString() : now.toISOString()
  );

  const achievement = await getAchievementProgress(userId, achievementId);

  return { achievement: achievement!, newlyUnlocked };
}

export async function checkAndUnlockAchievements(
  userId: string,
  eventType: "study" | "streak" | "test" | "class" | "set",
  data: any
): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = [];

  if (eventType === "study") {
    const cardsStudied = data.cardsStudied || 1;
    
    // First study
    const firstStudyResult = await updateAchievementProgress(userId, "first_study", 1);
    if (firstStudyResult.newlyUnlocked) newlyUnlocked.push(firstStudyResult.achievement);
    
    // Cards achievements
    const cards100Result = await updateAchievementProgress(userId, "cards_100", cardsStudied);
    if (cards100Result.newlyUnlocked) newlyUnlocked.push(cards100Result.achievement);
    
    const cards1000Result = await updateAchievementProgress(userId, "cards_1000", cardsStudied);
    if (cards1000Result.newlyUnlocked) newlyUnlocked.push(cards1000Result.achievement);
  }

  if (eventType === "streak") {
    const streak = data.streak || 1;
    
    // Streak achievements
    const streak3Result = await updateAchievementProgress(userId, "streak_3", streak);
    if (streak3Result.newlyUnlocked) newlyUnlocked.push(streak3Result.achievement);
    
    const streak7Result = await updateAchievementProgress(userId, "streak_7", streak);
    if (streak7Result.newlyUnlocked) newlyUnlocked.push(streak7Result.achievement);
    
    const streak30Result = await updateAchievementProgress(userId, "streak_30", streak);
    if (streak30Result.newlyUnlocked) newlyUnlocked.push(streak30Result.achievement);
  }

  if (eventType === "test") {
    const perfectScore = data.perfectScore || false;
    const testsCompleted = data.testsCompleted || 1;
    
    // Perfect test
    if (perfectScore) {
      const perfectTestResult = await updateAchievementProgress(userId, "perfect_test", 1);
      if (perfectTestResult.newlyUnlocked) newlyUnlocked.push(perfectTestResult.achievement);
    }
    
    // Test count
    const test10Result = await updateAchievementProgress(userId, "test_10", testsCompleted);
    if (test10Result.newlyUnlocked) newlyUnlocked.push(test10Result.achievement);
  }

  if (eventType === "class") {
    const joinedClass = data.joinedClass || false;
    
    if (joinedClass) {
      const joinClassResult = await updateAchievementProgress(userId, "join_class", 1);
      if (joinClassResult.newlyUnlocked) newlyUnlocked.push(joinClassResult.achievement);
    }
  }

  if (eventType === "set") {
    const createdSet = data.createdSet || false;
    
    if (createdSet) {
      const createSetResult = await updateAchievementProgress(userId, "create_set", 1);
      if (createSetResult.newlyUnlocked) newlyUnlocked.push(createSetResult.achievement);
    }
  }

  return newlyUnlocked;
}

export async function getUnlockedAchievements(userId: string): Promise<Achievement[]> {
  const achievements = await getUserAchievements(userId);
  return achievements.filter(a => a.unlockedAt !== null);
}

export async function getLockedAchievements(userId: string): Promise<Achievement[]> {
  const achievements = await getUserAchievements(userId);
  return achievements.filter(a => a.unlockedAt === null);
}
