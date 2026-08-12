export interface GamificationStats {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  cardsReviewed: number;
  perfectSessions: number;
  badges: string[];
}

export type GamificationEvent =
  | 'review_card'
  | 'complete_session'
  | 'perfect_session'
  | 'keep_streak'
  | 'finish_deck';

const XP_REWARDS: Record<GamificationEvent, number> = {
  review_card: 10,
  complete_session: 50,
  perfect_session: 100,
  keep_streak: 25,
  finish_deck: 150,
};

export const DEFAULT_GAMIFICATION_STATS: GamificationStats = {
  xp: 1240,
  level: 4,
  currentStreak: 12,
  longestStreak: 18,
  cardsReviewed: 327,
  perfectSessions: 3,
  badges: ['first-session', 'week-warrior', 'deep-focus'],
};

export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) * 300 + (level - 1) * (level - 2) * 50);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function xpProgress(stats: Pick<GamificationStats, 'xp'>) {
  const level = levelForXp(stats.xp);
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  const earned = stats.xp - start;
  return {
    level,
    current: earned,
    required: end - start,
    percentage: Math.round((earned / Math.max(end - start, 1)) * 100),
  };
}

export function awardXp(stats: GamificationStats, event: GamificationEvent): GamificationStats {
  const nextXp = stats.xp + XP_REWARDS[event];
  return {
    ...stats,
    xp: nextXp,
    level: levelForXp(nextXp),
    cardsReviewed: event === 'review_card' ? stats.cardsReviewed + 1 : stats.cardsReviewed,
    perfectSessions:
      event === 'perfect_session' ? stats.perfectSessions + 1 : stats.perfectSessions,
  };
}

export function getXpReward(event: GamificationEvent): number {
  return XP_REWARDS[event];
}
