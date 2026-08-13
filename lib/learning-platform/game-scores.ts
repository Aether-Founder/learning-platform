import { readStoredJson, writeStoredJson } from '../errors';

export type GameScoreId = 'match' | 'blast' | 'blocks' | 'sprint' | 'type-rush';

const KEY = 'learning-platform-highscores-v1';

type ScoreStore = Record<string, Partial<Record<GameScoreId, number>>>;

function load(): ScoreStore {
  return readStoredJson<ScoreStore>(KEY, {});
}

function save(store: ScoreStore): boolean {
  return writeStoredJson(KEY, store);
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

/** Returns true only when the value is a new record *and* it was persisted. */
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
    return save(store);
  }
  return false;
}
