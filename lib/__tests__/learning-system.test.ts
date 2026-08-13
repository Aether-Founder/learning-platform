import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  achievements,
  applySessionResults,
  createChallenge,
  createId,
  createLearningSet,
  defaultPreferences,
  defaultStats,
  exportLearningState,
  forecastDueCards,
  generateOptions,
  getDefaultProgress,
  getDueCards,
  getLevel,
  levenshtein,
  loadLearningState,
  parseImportText,
  qualityFromSimilarity,
  saveLearningState,
  shuffle,
  similarityPercent,
  updateFsrs,
  updateProgress,
  updateSm2,
  xpForQuality,
  type CardProgress,
  type LearningSet,
  type StudyCard,
  type StudyResponse,
  type UserStats,
} from '@/lib/learning-system';

const STORAGE_KEY = 'advanced-learning-system-v1';

function makeCard(id: string, front: string, back: string): StudyCard {
  const now = new Date().toISOString();
  return { id, front, back, type: 'basic', createdAt: now, updatedAt: now };
}

function makeSet(cards: StudyCard[]): LearningSet {
  const now = new Date().toISOString();
  return {
    id: 'set-1',
    name: 'Set',
    cards,
    dailyNewLimit: 20,
    createdAt: now,
    updatedAt: now,
  };
}

function makeResponse(overrides: Partial<StudyResponse> = {}): StudyResponse {
  return { cardId: 'card-1', quality: 'good', isCorrect: true, timeMs: 5000, ...overrides };
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

describe('learning-system', () => {
  describe('createId', () => {
    it('prefixes ids and keeps them unique', () => {
      const first = createId('card');
      const second = createId('card');
      expect(first.startsWith('card-')).toBe(true);
      expect(first).not.toBe(second);
    });
  });

  describe('getLevel', () => {
    it('derives the level from the square root of xp', () => {
      expect(getLevel(0)).toBe(0);
      expect(getLevel(99)).toBe(0);
      expect(getLevel(100)).toBe(1);
      expect(getLevel(400)).toBe(2);
      expect(getLevel(2500)).toBe(5);
    });
  });

  describe('xpForQuality', () => {
    it('rewards better recall with more xp', () => {
      expect(xpForQuality('easy')).toBe(10);
      expect(xpForQuality('good')).toBe(7);
      expect(xpForQuality('hard')).toBe(5);
      expect(xpForQuality('again')).toBe(2);
    });
  });

  describe('getDefaultProgress', () => {
    it('starts a card at neutral sm2 and fsrs values', () => {
      const progress = getDefaultProgress('card-1');
      expect(progress.cardId).toBe('card-1');
      expect(progress.sm2.easeFactor).toBe(2.5);
      expect(progress.sm2.repetitions).toBe(0);
      expect(progress.fsrs.difficulty).toBe(5);
      expect(progress.reviews).toBe(0);
      expect(progress.responses).toEqual({ again: 0, hard: 0, good: 0, easy: 0 });
    });
  });

  describe('updateSm2', () => {
    it('resets the interval and repetitions on "again"', () => {
      const progress = getDefaultProgress('card-1');
      progress.sm2 = { easeFactor: 2.2, intervalDays: 12, repetitions: 4, nextReviewAt: '' };
      const sm2 = updateSm2(progress, 'again');
      expect(sm2.intervalDays).toBe(0);
      expect(sm2.repetitions).toBe(0);
      expect(sm2.easeFactor).toBe(2.2);
      expect(new Date(sm2.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('lowers the ease factor on "hard" and raises it on "easy"', () => {
      const progress = getDefaultProgress('card-1');
      progress.sm2 = { easeFactor: 2.0, intervalDays: 10, repetitions: 2, nextReviewAt: '' };
      expect(updateSm2(progress, 'hard').easeFactor).toBeCloseTo(1.7);
      expect(updateSm2(progress, 'easy').easeFactor).toBeCloseTo(2.3);
    });

    it('clamps the ease factor between 1.3 and 2.5', () => {
      const low = getDefaultProgress('card-1');
      low.sm2 = { easeFactor: 1.4, intervalDays: 3, repetitions: 1, nextReviewAt: '' };
      expect(updateSm2(low, 'hard').easeFactor).toBe(1.3);

      const high = getDefaultProgress('card-2');
      high.sm2 = { easeFactor: 2.4, intervalDays: 3, repetitions: 1, nextReviewAt: '' };
      expect(updateSm2(high, 'easy').easeFactor).toBe(2.5);
    });

    it('gives a first interval of one day to a brand new card', () => {
      const sm2 = updateSm2(getDefaultProgress('card-1'), 'good');
      expect(sm2.intervalDays).toBe(1);
      expect(sm2.repetitions).toBe(1);
    });

    it('grows the interval faster for "easy" than for "good"', () => {
      const progress = getDefaultProgress('card-1');
      progress.sm2 = { easeFactor: 2.0, intervalDays: 10, repetitions: 3, nextReviewAt: '' };
      const good = updateSm2(progress, 'good').intervalDays;
      const easy = updateSm2(progress, 'easy').intervalDays;
      const hard = updateSm2(progress, 'hard').intervalDays;
      expect(easy).toBeGreaterThan(good);
      expect(good).toBeGreaterThan(hard);
    });
  });

  describe('updateFsrs', () => {
    it('drops stability and schedules a near-term review on "again"', () => {
      const progress = getDefaultProgress('card-1');
      progress.fsrs = { difficulty: 5, stability: 20, retrievability: 1, nextReviewAt: '' };
      const fsrs = updateFsrs(progress, 'again');
      expect(fsrs.stability).toBe(0.5);
      expect(fsrs.difficulty).toBeCloseTo(5.9);
      expect(new Date(fsrs.nextReviewAt).getTime() - Date.now()).toBeLessThan(2 * 60 * 60 * 1000);
    });

    it('increases stability and lowers difficulty on "easy"', () => {
      const progress = getDefaultProgress('card-1');
      const fsrs = updateFsrs(progress, 'easy');
      expect(fsrs.stability).toBeGreaterThan(progress.fsrs.stability);
      expect(fsrs.difficulty).toBeLessThan(progress.fsrs.difficulty);
      expect(fsrs.retrievability).toBe(1);
    });

    it('clamps difficulty to the 1..10 range', () => {
      const progress = getDefaultProgress('card-1');
      progress.fsrs = { difficulty: 9.9, stability: 1, retrievability: 1, nextReviewAt: '' };
      expect(updateFsrs(progress, 'again').difficulty).toBe(10);

      progress.fsrs = { difficulty: 1.1, stability: 1, retrievability: 1, nextReviewAt: '' };
      expect(updateFsrs(progress, 'easy').difficulty).toBe(1);
    });
  });

  describe('updateProgress', () => {
    it('creates progress for an unseen card and counts the review', () => {
      const progress = updateProgress(undefined, makeResponse({ timeMs: 1200 }));
      expect(progress.cardId).toBe('card-1');
      expect(progress.reviews).toBe(1);
      expect(progress.correct).toBe(1);
      expect(progress.totalTimeMs).toBe(1200);
      expect(progress.responses.good).toBe(1);
    });

    it('accumulates onto existing progress and skips incorrect answers', () => {
      const existing: CardProgress = {
        ...getDefaultProgress('card-1'),
        reviews: 3,
        correct: 2,
        totalTimeMs: 9000,
      };
      const progress = updateProgress(
        existing,
        makeResponse({ quality: 'again', isCorrect: false, timeMs: 1000 })
      );
      expect(progress.reviews).toBe(4);
      expect(progress.correct).toBe(2);
      expect(progress.totalTimeMs).toBe(10000);
      expect(progress.responses.again).toBe(1);
    });
  });

  describe('levenshtein / similarityPercent / qualityFromSimilarity', () => {
    it('measures edit distance case-insensitively', () => {
      expect(levenshtein('kitten', 'sitting')).toBe(3);
      expect(levenshtein('Hallo', ' hallo ')).toBe(0);
      expect(levenshtein('', 'abc')).toBe(3);
    });

    it('scores identical answers as 100 percent', () => {
      expect(similarityPercent('antwoord', 'antwoord')).toBe(100);
      expect(similarityPercent('', '')).toBe(100);
    });

    it('scores a partially wrong answer below 100 percent', () => {
      const percent = similarityPercent('antword', 'antwoord');
      expect(percent).toBeGreaterThan(50);
      expect(percent).toBeLessThan(100);
    });

    it('maps similarity onto a response quality', () => {
      expect(qualityFromSimilarity(100)).toBe('easy');
      expect(qualityFromSimilarity(95)).toBe('good');
      expect(qualityFromSimilarity(90)).toBe('good');
      expect(qualityFromSimilarity(80)).toBe('hard');
      expect(qualityFromSimilarity(74)).toBe('again');
    });
  });

  describe('generateOptions', () => {
    it('returns four options including the correct answer', () => {
      const card = makeCard('c1', 'Vraag 1', 'Antwoord 1');
      const cards = [
        card,
        makeCard('c2', 'Vraag 2', 'Antwoord 2'),
        makeCard('c3', 'Vraag 3', 'Antwoord 3'),
        makeCard('c4', 'Vraag 4', 'Antwoord 4'),
      ];
      const options = generateOptions(cards, card);
      expect(options).toHaveLength(4);
      expect(options).toContain('Antwoord 1');
      expect(new Set(options).size).toBe(4);
    });

    it('pads with placeholders when there are too few distractors', () => {
      const card = makeCard('c1', 'Vraag 1', 'Antwoord 1');
      const options = generateOptions([card], card);
      expect(options).toHaveLength(4);
      expect(options).toContain('Antwoord 1');
      expect(options.filter((option) => option.startsWith('Option '))).toHaveLength(3);
    });
  });

  describe('shuffle', () => {
    it('keeps the same members without mutating the input', () => {
      const items = [1, 2, 3, 4, 5];
      const shuffled = shuffle(items);
      expect(shuffled).not.toBe(items);
      expect([...shuffled].sort()).toEqual(items);
    });
  });

  describe('parseImportText', () => {
    it('parses comma, tab and pipe separated lines', () => {
      const { cards, warnings } = parseImportText('a,b\nc\td\ne|f');
      expect(warnings).toHaveLength(0);
      expect(cards).toEqual([
        { front: 'a', back: 'b' },
        { front: 'c', back: 'd' },
        { front: 'e', back: 'f' },
      ]);
    });

    it('keeps separators that appear inside the answer', () => {
      const { cards } = parseImportText('vraag,deel1,deel2');
      expect(cards).toEqual([{ front: 'vraag', back: 'deel1,deel2' }]);
    });

    it('warns about lines without an answer and skips blank lines', () => {
      const { cards, warnings } = parseImportText('\nalleen-vraag\n\nvraag,antwoord');
      expect(cards).toEqual([{ front: 'vraag', back: 'antwoord' }]);
      expect(warnings).toEqual(['Line 2 skipped: expected question and answer.']);
    });
  });

  describe('createLearningSet', () => {
    it('builds a set with generated ids and defaults', () => {
      const set = createLearningSet('Biologie', [{ front: 'a', back: 'b' }]);
      expect(set.name).toBe('Biologie');
      expect(set.description).toBe('');
      expect(set.category).toBe('General');
      expect(set.dailyNewLimit).toBe(20);
      expect(set.cards).toHaveLength(1);
      expect(set.cards[0].type).toBe('basic');
      expect(set.cards[0].id.startsWith('card-')).toBe(true);
    });
  });

  describe('createChallenge', () => {
    it('picks a deterministic challenge type per date', () => {
      const challenge = createChallenge('2024-05-13');
      expect(challenge).toEqual(createChallenge('2024-05-13'));
      expect(challenge.id).toBe('challenge-2024-05-13');
      expect(challenge.progress).toBe(0);
      expect(challenge.completed).toBe(false);
      expect(['speed', 'accuracy', 'volume', 'consistency']).toContain(challenge.type);
    });

    it('rotates the challenge type across dates', () => {
      const types = ['2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04'].map(
        (date) => createChallenge(date).type
      );
      expect(new Set(types).size).toBeGreaterThan(1);
    });
  });

  describe('applySessionResults', () => {
    it('accumulates cards, xp and session counters', () => {
      const responses = [
        makeResponse({ quality: 'good', timeMs: 4000 }),
        makeResponse({ cardId: 'card-2', quality: 'easy', timeMs: 12000 }),
      ];
      const { stats } = applySessionResults(defaultStats, responses, 2);
      expect(stats.cardsReviewed).toBe(2);
      expect(stats.sessionsCompleted).toBe(1);
      expect(stats.perfectSessions).toBe(1);
      expect(stats.fastReviews).toBe(1);
      expect(stats.setsCreated).toBe(2);
      expect(stats.totalStudyTimeMs).toBe(16000);
      expect(stats.responses).toEqual({ again: 0, hard: 0, good: 1, easy: 1 });
      expect(stats.totalXp).toBeGreaterThanOrEqual(17);
    });

    it('does not count a session with a wrong answer as perfect', () => {
      const { stats } = applySessionResults(
        defaultStats,
        [makeResponse(), makeResponse({ isCorrect: false, quality: 'again' })],
        1
      );
      expect(stats.perfectSessions).toBe(0);
    });

    it('starts a streak on the first study day', () => {
      const { stats } = applySessionResults(defaultStats, [makeResponse()], 1);
      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(1);
      expect(stats.lastStudyDate).toBe(new Date().toISOString().slice(0, 10));
    });

    it('continues the streak when the previous session was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const previous: UserStats = {
        ...defaultStats,
        currentStreak: 4,
        longestStreak: 4,
        lastStudyDate: yesterday.toISOString().slice(0, 10),
      };
      const { stats } = applySessionResults(previous, [makeResponse()], 1);
      expect(stats.currentStreak).toBe(5);
      expect(stats.longestStreak).toBe(5);
    });

    it('resets the streak after a missed day', () => {
      const previous: UserStats = {
        ...defaultStats,
        currentStreak: 9,
        longestStreak: 9,
        lastStudyDate: '2020-01-01',
      };
      const { stats } = applySessionResults(previous, [makeResponse()], 1);
      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(9);
    });

    it('leaves the streak untouched for a second session on the same day', () => {
      const previous: UserStats = {
        ...defaultStats,
        currentStreak: 3,
        lastStudyDate: new Date().toISOString().slice(0, 10),
      };
      const { stats } = applySessionResults(previous, [makeResponse()], 1);
      expect(stats.currentStreak).toBe(3);
    });

    it('awards volume bonuses for longer sessions', () => {
      const small = applySessionResults(
        defaultStats,
        Array.from({ length: 9 }, () => makeResponse()),
        1
      ).stats.totalXp;
      const medium = applySessionResults(
        defaultStats,
        Array.from({ length: 10 }, () => makeResponse()),
        1
      ).stats.totalXp;
      expect(medium - small).toBeGreaterThanOrEqual(50 + xpForQuality('good'));
    });

    it('unlocks achievements once their target is met', () => {
      const { stats } = applySessionResults(defaultStats, [makeResponse()], 1);
      expect(stats.unlockedAchievements).toContain('sessions-1');
      expect(stats.unlockedAchievements).toContain('perfect-1');
      expect(stats.unlockedAchievements).toContain('sets-1');
    });

    it('does not unlock the same achievement twice', () => {
      const first = applySessionResults(defaultStats, [makeResponse()], 1).stats;
      const second = applySessionResults(first, [makeResponse()], 1).stats;
      const unlockedOnce = second.unlockedAchievements.filter((id) => id === 'sessions-1');
      expect(unlockedOnce).toHaveLength(1);
    });

    it('accumulates daily activity for the current day', () => {
      const today = new Date().toISOString().slice(0, 10);
      const first = applySessionResults(defaultStats, [makeResponse({ timeMs: 1000 })], 1).stats;
      const second = applySessionResults(first, [makeResponse({ timeMs: 2000 })], 1).stats;
      expect(second.dailyActivity[today]).toEqual({ cards: 2, timeMs: 3000 });
    });

    it('completes a volume challenge and awards its xp', () => {
      const today = new Date().toISOString().slice(0, 10);
      const previous: UserStats = {
        ...defaultStats,
        challenge: {
          id: `challenge-${today}`,
          date: today,
          type: 'volume',
          title: 'Volume challenge',
          target: 2,
          progress: 0,
          xp: 125,
          completed: false,
        },
      };
      const { stats } = applySessionResults(previous, [makeResponse(), makeResponse()], 1);
      expect(stats.challenge?.completed).toBe(true);
      expect(stats.challenge?.progress).toBe(2);
    });

    it('reports a level up when the xp threshold is crossed', () => {
      const previous: UserStats = { ...defaultStats, totalXp: 95 };
      const { leveledUp } = applySessionResults(previous, [makeResponse()], 1);
      expect(leveledUp).toBe(true);
    });

    it('does not mutate the stats it is given', () => {
      const previous: UserStats = { ...defaultStats };
      applySessionResults(previous, [makeResponse()], 1);
      expect(previous.cardsReviewed).toBe(0);
      expect(previous.responses.good).toBe(0);
    });
  });

  describe('achievements catalogue', () => {
    it('exposes unique ids with positive targets', () => {
      expect(achievements.length).toBeGreaterThan(0);
      expect(new Set(achievements.map((a) => a.id)).size).toBe(achievements.length);
      expect(achievements.every((a) => a.target > 0 && a.xp > 0)).toBe(true);
    });
  });

  describe('getDueCards', () => {
    it('treats cards without progress as due', () => {
      const set = makeSet([makeCard('c1', 'a', 'b')]);
      expect(getDueCards(set, {}, 'sm2')).toHaveLength(1);
    });

    it('filters out cards scheduled in the future per algorithm', () => {
      const set = makeSet([makeCard('c1', 'a', 'b'), makeCard('c2', 'c', 'd')]);
      const progress: Record<string, CardProgress> = {
        c1: {
          ...getDefaultProgress('c1'),
          sm2: { easeFactor: 2.5, intervalDays: 5, repetitions: 1, nextReviewAt: daysFromNow(5) },
          fsrs: { difficulty: 5, stability: 1, retrievability: 1, nextReviewAt: daysFromNow(-1) },
        },
        c2: {
          ...getDefaultProgress('c2'),
          sm2: { easeFactor: 2.5, intervalDays: 1, repetitions: 1, nextReviewAt: daysFromNow(-1) },
          fsrs: { difficulty: 5, stability: 1, retrievability: 1, nextReviewAt: daysFromNow(3) },
        },
      };
      expect(getDueCards(set, progress, 'sm2').map((card) => card.id)).toEqual(['c2']);
      expect(getDueCards(set, progress, 'fsrs').map((card) => card.id)).toEqual(['c1']);
    });
  });

  describe('forecastDueCards', () => {
    it('returns a seven day forecast starting today', () => {
      const set = makeSet([makeCard('c1', 'a', 'b')]);
      const forecast = forecastDueCards(set, {}, 'sm2');
      expect(forecast).toHaveLength(7);
      expect(forecast[0].date).toBe(new Date().toISOString().slice(0, 10));
      expect(forecast[0].count).toBe(1);
      expect(forecast.slice(1).every((day) => day.count === 0)).toBe(true);
    });

    it('counts scheduled cards on their review day', () => {
      const set = makeSet([makeCard('c1', 'a', 'b')]);
      const nextReviewAt = daysFromNow(2);
      const progress: Record<string, CardProgress> = {
        c1: {
          ...getDefaultProgress('c1'),
          sm2: { easeFactor: 2.5, intervalDays: 2, repetitions: 1, nextReviewAt },
        },
      };
      const forecast = forecastDueCards(set, progress, 'sm2');
      const day = forecast.find((entry) => entry.date === nextReviewAt.slice(0, 10));
      expect(day?.count).toBe(1);
    });
  });

  describe('state persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('returns defaults when nothing is stored', () => {
      const state = loadLearningState();
      expect(state.sets).toEqual([]);
      expect(state.progress).toEqual({});
      expect(state.stats).toEqual(defaultStats);
      expect(state.preferences).toEqual(defaultPreferences);
    });

    it('returns defaults when the stored payload is corrupt', () => {
      localStorage.setItem(STORAGE_KEY, 'not-json');
      expect(loadLearningState().stats).toEqual(defaultStats);
    });

    it('round-trips a saved state and merges partial stats and preferences', () => {
      const set = createLearningSet('Set', [{ front: 'a', back: 'b' }]);
      saveLearningState({
        sets: [set],
        progress: {},
        stats: { ...defaultStats, cardsReviewed: 12 },
        preferences: { ...defaultPreferences, cardLimit: 5 },
      });
      const state = loadLearningState();
      expect(state.sets).toHaveLength(1);
      expect(state.stats.cardsReviewed).toBe(12);
      expect(state.stats.responses).toEqual(defaultStats.responses);
      expect(state.preferences.cardLimit).toBe(5);
      expect(state.preferences.mode).toBe(defaultPreferences.mode);
    });

    it('returns defaults on the server where there is no window', () => {
      vi.stubGlobal('window', undefined);
      expect(loadLearningState()).toEqual({
        sets: [],
        progress: {},
        stats: defaultStats,
        preferences: defaultPreferences,
      });
    });
  });

  describe('exportLearningState', () => {
    it('serialises the state with an export timestamp', () => {
      const exported = JSON.parse(
        exportLearningState({
          sets: [],
          progress: {},
          stats: defaultStats,
          preferences: defaultPreferences,
        })
      );
      expect(exported.stats).toEqual(defaultStats);
      expect(typeof exported.exportedAt).toBe('string');
    });
  });
});
