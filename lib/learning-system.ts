import { readStoredJson, writeStoredJson } from './errors';

export type StudyModeId = 'flashcard' | 'multiple-choice' | 'typing' | 'matching';
export type ResponseQuality = 'again' | 'hard' | 'good' | 'easy';
export type CardType = 'basic' | 'cloze' | 'image-occlusion';
export type SrsAlgorithm = 'sm2' | 'fsrs';

export interface StudyCard {
  id: string;
  front: string;
  back: string;
  type: CardType;
  difficulty?: 'easy' | 'medium' | 'hard';
  clozeText?: string;
  imageUrl?: string;
  audioUrl?: string;
  occlusions?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LearningSet {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cards: StudyCard[];
  dailyNewLimit: number;
  createdAt: string;
  updatedAt: string;
  lastStudiedAt?: string;
}

export interface CardProgress {
  cardId: string;
  sm2: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewAt: string;
  };
  fsrs: {
    difficulty: number;
    stability: number;
    retrievability: number;
    nextReviewAt: string;
  };
  reviews: number;
  correct: number;
  totalTimeMs: number;
  responses: Record<ResponseQuality, number>;
}

export interface SessionPreferences {
  mode: StudyModeId;
  cardLimit: number;
  timeLimitMinutes: number;
  reviewMix: 'due' | 'new' | 'mix';
  fuzzyThreshold: number;
  autoplayAudio: boolean;
  srsAlgorithm: SrsAlgorithm;
}

export interface StudyResponse {
  cardId: string;
  quality: ResponseQuality;
  isCorrect: boolean;
  timeMs: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  xp: number;
  target: number;
  metric:
    | 'cardsReviewed'
    | 'sessionsCompleted'
    | 'streak'
    | 'perfectSessions'
    | 'fastReviews'
    | 'setsCreated';
}

export interface DailyChallenge {
  id: string;
  date: string;
  type: 'speed' | 'accuracy' | 'volume' | 'consistency';
  title: string;
  target: number;
  progress: number;
  xp: number;
  completed: boolean;
}

export interface UserStats {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  cardsReviewed: number;
  sessionsCompleted: number;
  perfectSessions: number;
  fastReviews: number;
  setsCreated: number;
  totalStudyTimeMs: number;
  responses: Record<ResponseQuality, number>;
  dailyActivity: Record<string, { cards: number; timeMs: number }>;
  unlockedAchievements: string[];
  challenge?: DailyChallenge;
}

export interface LearningState {
  sets: LearningSet[];
  progress: Record<string, CardProgress>;
  stats: UserStats;
  preferences: SessionPreferences;
}

const STORAGE_KEY = 'advanced-learning-system-v1';
const todayKey = () => new Date().toISOString().slice(0, 10);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const defaultPreferences: SessionPreferences = {
  mode: 'flashcard',
  cardLimit: 20,
  timeLimitMinutes: 0,
  reviewMix: 'mix',
  fuzzyThreshold: 80,
  autoplayAudio: false,
  srsAlgorithm: 'sm2',
};

export const defaultStats: UserStats = {
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  cardsReviewed: 0,
  sessionsCompleted: 0,
  perfectSessions: 0,
  fastReviews: 0,
  setsCreated: 0,
  totalStudyTimeMs: 0,
  responses: { again: 0, hard: 0, good: 0, easy: 0 },
  dailyActivity: {},
  unlockedAchievements: [],
};

export const achievements: Achievement[] = [
  ['cards-10', 'First Ten', 'Review 10 cards', 'Bronze', 50, 10, 'cardsReviewed'],
  ['cards-50', 'Warmup Complete', 'Review 50 cards', 'Bronze', 50, 50, 'cardsReviewed'],
  ['cards-100', 'Century', 'Review 100 cards', 'Silver', 100, 100, 'cardsReviewed'],
  ['cards-250', 'Committed', 'Review 250 cards', 'Silver', 100, 250, 'cardsReviewed'],
  ['cards-500', 'Deep Practice', 'Review 500 cards', 'Gold', 250, 500, 'cardsReviewed'],
  ['cards-1000', 'Long Game', 'Review 1,000 cards', 'Platinum', 500, 1000, 'cardsReviewed'],
  ['sessions-1', 'First Session', 'Complete one session', 'Bronze', 50, 1, 'sessionsCompleted'],
  ['sessions-5', 'Routine', 'Complete 5 sessions', 'Bronze', 50, 5, 'sessionsCompleted'],
  ['sessions-15', 'Reliable', 'Complete 15 sessions', 'Silver', 100, 15, 'sessionsCompleted'],
  ['sessions-30', 'Study Habit', 'Complete 30 sessions', 'Gold', 250, 30, 'sessionsCompleted'],
  ['streak-3', 'Three Day Spark', 'Reach a 3 day streak', 'Bronze', 50, 3, 'streak'],
  ['streak-7', 'Weekly Streak', 'Reach a 7 day streak', 'Silver', 100, 7, 'streak'],
  ['streak-30', 'Monthly Streak', 'Reach a 30 day streak', 'Gold', 250, 30, 'streak'],
  ['streak-100', 'Unbroken', 'Reach a 100 day streak', 'Platinum', 500, 100, 'streak'],
  ['perfect-1', 'Clean Sweep', 'Complete a perfect session', 'Bronze', 50, 1, 'perfectSessions'],
  ['perfect-5', 'Sharp Recall', 'Complete 5 perfect sessions', 'Silver', 100, 5, 'perfectSessions'],
  ['perfect-15', 'Precision', 'Complete 15 perfect sessions', 'Gold', 250, 15, 'perfectSessions'],
  [
    'fast-10',
    'Quick Thinker',
    'Answer 10 cards in under 8 seconds',
    'Bronze',
    50,
    10,
    'fastReviews',
  ],
  ['fast-50', 'Fast Lane', 'Answer 50 cards in under 8 seconds', 'Silver', 100, 50, 'fastReviews'],
  ['sets-1', 'Set Builder', 'Create one learning set', 'Bronze', 50, 1, 'setsCreated'],
  ['sets-5', 'Organizer', 'Create 5 learning sets', 'Silver', 100, 5, 'setsCreated'],
].map(([id, title, description, tier, xp, target, metric]) => ({
  id: id as string,
  title: title as string,
  description: description as string,
  tier: tier as Achievement['tier'],
  xp: xp as number,
  target: target as number,
  metric: metric as Achievement['metric'],
}));

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getLevel(totalXp: number) {
  return Math.floor(Math.sqrt(totalXp / 100));
}

export function xpForQuality(quality: ResponseQuality) {
  return quality === 'easy' ? 10 : quality === 'good' ? 7 : quality === 'hard' ? 5 : 2;
}

export function getDefaultProgress(cardId: string): CardProgress {
  const now = new Date().toISOString();
  return {
    cardId,
    sm2: { easeFactor: 2.5, intervalDays: 0, repetitions: 0, nextReviewAt: now },
    fsrs: { difficulty: 5, stability: 1, retrievability: 1, nextReviewAt: now },
    reviews: 0,
    correct: 0,
    totalTimeMs: 0,
    responses: { again: 0, hard: 0, good: 0, easy: 0 },
  };
}

function addMinutes(minutes: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function updateSm2(progress: CardProgress, quality: ResponseQuality): CardProgress['sm2'] {
  const current = progress.sm2 || getDefaultProgress(progress.cardId).sm2;
  if (quality === 'again') {
    return {
      easeFactor: current.easeFactor,
      intervalDays: 0,
      repetitions: 0,
      nextReviewAt: addMinutes(1),
    };
  }

  const easeFactor = clamp(
    quality === 'hard'
      ? current.easeFactor * 0.85
      : quality === 'easy'
        ? current.easeFactor * 1.15
        : current.easeFactor,
    1.3,
    2.5
  );
  const baseInterval = current.intervalDays <= 0 ? 1 : current.intervalDays * easeFactor;
  const intervalDays =
    quality === 'hard'
      ? Math.max(1, current.intervalDays * 1.2 || 1)
      : quality === 'easy'
        ? baseInterval * 1.3
        : baseInterval;
  return {
    easeFactor,
    intervalDays,
    repetitions: current.repetitions + 1,
    nextReviewAt: addDays(intervalDays),
  };
}

export function updateFsrs(progress: CardProgress, quality: ResponseQuality): CardProgress['fsrs'] {
  const current = progress.fsrs || getDefaultProgress(progress.cardId).fsrs;
  const qualityScore =
    quality === 'again' ? 1 : quality === 'hard' ? 2 : quality === 'good' ? 3 : 4;
  const difficulty = clamp(current.difficulty + (3 - qualityScore) * 0.45, 1, 10);
  const stability =
    quality === 'again' ? 0.5 : Math.max(0.5, current.stability * (1 + qualityScore / 5));
  const retrievability = clamp(qualityScore / 4, 0.25, 1);
  const intervalDays = quality === 'again' ? 1 / 24 : stability * retrievability;
  return { difficulty, stability, retrievability, nextReviewAt: addDays(intervalDays) };
}

export function updateProgress(
  progress: CardProgress | undefined,
  response: StudyResponse
): CardProgress {
  const base = progress || getDefaultProgress(response.cardId);
  return {
    ...base,
    sm2: updateSm2(base, response.quality),
    fsrs: updateFsrs(base, response.quality),
    reviews: base.reviews + 1,
    correct: base.correct + (response.isCorrect ? 1 : 0),
    totalTimeMs: base.totalTimeMs + response.timeMs,
    responses: { ...base.responses, [response.quality]: base.responses[response.quality] + 1 },
  };
}

export function levenshtein(a: string, b: string) {
  const left = a.toLowerCase().trim();
  const right = b.toLowerCase().trim();
  const matrix = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= right.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      matrix[i][j] =
        left[i - 1] === right[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[left.length][right.length];
}

export function similarityPercent(input: string, answer: string) {
  const maxLength = Math.max(input.trim().length, answer.trim().length, 1);
  return Math.round((1 - levenshtein(input, answer) / maxLength) * 100);
}

export function qualityFromSimilarity(percent: number): ResponseQuality {
  if (percent === 100) return 'easy';
  if (percent >= 90) return 'good';
  if (percent >= 75) return 'hard';
  return 'again';
}

export function generateOptions(cards: StudyCard[], card: StudyCard) {
  const candidates = cards
    .filter((candidate) => candidate.id !== card.id && candidate.back.trim())
    .map((candidate) => ({
      card: candidate,
      score: similarityPercent(candidate.front, card.front),
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.card.back);
  const unique = Array.from(new Set(candidates)).slice(0, 3);
  while (unique.length < 3) unique.push(`Option ${unique.length + 1}`);
  return shuffle([card.back, ...unique]).slice(0, 4);
}

export function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function parseImportText(text: string) {
  const warnings: string[] = [];
  const cards: Array<{ front: string; back: string }> = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const delimiter = trimmed.includes('\t') ? '\t' : trimmed.includes('|') ? '|' : ',';
    const [front, ...rest] = trimmed.split(delimiter);
    const back = rest.join(delimiter);
    if (!front?.trim() || !back?.trim()) {
      warnings.push(`Line ${index + 1} skipped: expected question and answer.`);
      return;
    }
    cards.push({ front: front.trim(), back: back.trim() });
  });
  return { cards, warnings };
}

export function createLearningSet(
  name: string,
  cards: Array<{ front: string; back: string }>,
  description = '',
  category = 'General'
): LearningSet {
  const now = new Date().toISOString();
  return {
    id: createId('set'),
    name,
    description,
    category,
    dailyNewLimit: 20,
    createdAt: now,
    updatedAt: now,
    cards: cards.map((card) => ({
      id: createId('card'),
      front: card.front,
      back: card.back,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
    })),
  };
}

export function createChallenge(date = todayKey()): DailyChallenge {
  const dayValue = date.split('-').join('');
  const seed = Number(dayValue.slice(-2)) || 1;
  const types: DailyChallenge['type'][] = ['speed', 'accuracy', 'volume', 'consistency'];
  const type = types[seed % types.length];
  const config = {
    speed: { title: 'Speed challenge: answer 10 cards under 8 seconds each', target: 10, xp: 150 },
    accuracy: { title: 'Accuracy challenge: finish a session at 85% correct', target: 85, xp: 175 },
    volume: { title: 'Volume challenge: review 20 cards today', target: 20, xp: 125 },
    consistency: { title: 'Consistency challenge: keep your streak alive', target: 1, xp: 100 },
  }[type];
  return { id: `challenge-${date}`, date, type, progress: 0, completed: false, ...config };
}

function achievementProgress(stats: UserStats, achievement: Achievement) {
  return achievement.metric === 'streak' ? stats.currentStreak : stats[achievement.metric];
}

export function applySessionResults(
  stats: UserStats,
  responses: StudyResponse[],
  setCount: number
) {
  const date = todayKey();
  const sessionTime = responses.reduce((sum, response) => sum + response.timeMs, 0);
  const correct = responses.filter((response) => response.isCorrect).length;
  const previousLevel = getLevel(stats.totalXp);
  const next: UserStats = {
    ...stats,
    cardsReviewed: stats.cardsReviewed + responses.length,
    sessionsCompleted: stats.sessionsCompleted + 1,
    setsCreated: Math.max(stats.setsCreated, setCount),
    totalStudyTimeMs: stats.totalStudyTimeMs + sessionTime,
    perfectSessions:
      stats.perfectSessions + (responses.length > 0 && correct === responses.length ? 1 : 0),
    fastReviews: stats.fastReviews + responses.filter((response) => response.timeMs <= 8000).length,
    responses: { ...stats.responses },
    dailyActivity: { ...stats.dailyActivity },
  };

  responses.forEach((response) => {
    next.totalXp += xpForQuality(response.quality);
    next.responses[response.quality] += 1;
  });
  if (responses.length >= 25) next.totalXp += 100;
  else if (responses.length >= 10) next.totalXp += 50;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  if (stats.lastStudyDate !== date) {
    next.currentStreak = stats.lastStudyDate === yesterdayKey ? stats.currentStreak + 1 : 1;
    next.longestStreak = Math.max(stats.longestStreak, next.currentStreak);
    next.lastStudyDate = date;
    if (next.currentStreak === 7) next.totalXp += 50;
    if (next.currentStreak === 30) next.totalXp += 200;
    if (next.currentStreak === 100) next.totalXp += 500;
    if (next.currentStreak === 365) next.totalXp += 1000;
  }

  const activity = next.dailyActivity[date] || { cards: 0, timeMs: 0 };
  next.dailyActivity[date] = {
    cards: activity.cards + responses.length,
    timeMs: activity.timeMs + sessionTime,
  };

  const challenge = next.challenge?.date === date ? { ...next.challenge } : createChallenge(date);
  if (!challenge.completed) {
    if (challenge.type === 'speed')
      challenge.progress = Math.max(
        challenge.progress,
        responses.filter((r) => r.timeMs <= 8000).length
      );
    if (challenge.type === 'accuracy')
      challenge.progress = Math.max(
        challenge.progress,
        responses.length ? Math.round((correct / responses.length) * 100) : 0
      );
    if (challenge.type === 'volume') challenge.progress = next.dailyActivity[date].cards;
    if (challenge.type === 'consistency') challenge.progress = next.currentStreak > 0 ? 1 : 0;
    if (challenge.progress >= challenge.target) {
      challenge.completed = true;
      next.totalXp += challenge.xp;
    }
  }
  next.challenge = challenge;

  achievements.forEach((achievement) => {
    if (
      !next.unlockedAchievements.includes(achievement.id) &&
      achievementProgress(next, achievement) >= achievement.target
    ) {
      next.unlockedAchievements = [...next.unlockedAchievements, achievement.id];
      next.totalXp += achievement.xp;
    }
  });

  return { stats: next, leveledUp: getLevel(next.totalXp) > previousLevel };
}

export function getDueCards(
  set: LearningSet,
  progress: Record<string, CardProgress>,
  algorithm: SrsAlgorithm
) {
  const now = Date.now();
  return set.cards.filter((card) => {
    const cardProgress = progress[card.id];
    if (!cardProgress) return true;
    const nextReviewAt =
      algorithm === 'fsrs' ? cardProgress.fsrs.nextReviewAt : cardProgress.sm2.nextReviewAt;
    return new Date(nextReviewAt).getTime() <= now;
  });
}

export function forecastDueCards(
  set: LearningSet,
  progress: Record<string, CardProgress>,
  algorithm: SrsAlgorithm
) {
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    const key = day.toISOString().slice(0, 10);
    const count = set.cards.filter((card) => {
      const cardProgress = progress[card.id];
      if (!cardProgress) return offset === 0;
      const nextReviewAt =
        algorithm === 'fsrs' ? cardProgress.fsrs.nextReviewAt : cardProgress.sm2.nextReviewAt;
      return nextReviewAt.slice(0, 10) === key;
    }).length;
    return { date: key, count };
  });
}

export function loadLearningState(): LearningState {
  const empty: LearningState = {
    sets: [],
    progress: {},
    stats: defaultStats,
    preferences: defaultPreferences,
  };
  const parsed = readStoredJson<Partial<LearningState> | null>(STORAGE_KEY, null);
  if (!parsed) return empty;

  return {
    sets: parsed.sets || [],
    progress: parsed.progress || {},
    stats: {
      ...defaultStats,
      ...(parsed.stats || {}),
      responses: { ...defaultStats.responses, ...(parsed.stats?.responses || {}) },
    },
    preferences: { ...defaultPreferences, ...(parsed.preferences || {}) },
  };
}

export function saveLearningState(state: LearningState): boolean {
  return writeStoredJson(STORAGE_KEY, state);
}

export function exportLearningState(state: LearningState) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}
