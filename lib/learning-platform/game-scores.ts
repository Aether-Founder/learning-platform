export type GameScoreId = 'match' | 'blast' | 'blocks' | 'sprint' | 'type-rush';

const KEY = 'learning-platform-highscores-v1';

type ScoreStore = Record<string, Partial<Record<GameScoreId, number>>>;

function load(): ScoreStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function save(store: ScoreStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

/** Higher is better for blast/blocks score; lower is better for match time — use `lowerIsBetter` */
export function getHighScore(
  studySetId: string,
  gameId: GameScoreId,
  _lowerIsBetter = false
): number | null {
  const v = load()[studySetId]?.[gameId];
  return v === undefined ? null : v;
}

export function saveHighScore(
  studySetId: string,
  gameId: GameScoreId,
  value: number,
  lowerIsBetter = false
): boolean {
  const store = load();
  const prev = store[studySetId]?.[gameId];
  const isNew = prev === undefined || (lowerIsBetter ? value < prev : value > prev);
  if (isNew) {
    store[studySetId] = { ...store[studySetId], [gameId]: value };
    save(store);
  }
  return isNew;
}
