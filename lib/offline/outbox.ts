import { logger } from '../logger';

export interface OfflineReviewEvent {
  id: string;
  cardId: string;
  studySetId: string;
  grade: "again" | "hard" | "good" | "easy";
  timestamp: string;
  synced: boolean;
}

const OUTBOX_STORAGE_KEY = 'aether_review_outbox_v1';

export function getOfflineOutbox(): OfflineReviewEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    logger.error('Failed to parse offline review outbox', error);
    return [];
  }
}

export function addReviewToOutbox(event: Omit<OfflineReviewEvent, 'synced'>): OfflineReviewEvent {
  const outbox = getOfflineOutbox();
  const entry: OfflineReviewEvent = { ...event, synced: false };
  outbox.push(entry);
  if (typeof window !== 'undefined') {
    localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
  }
  logger.info('Added review event to offline outbox', { id: event.id, cardId: event.cardId, grade: event.grade });
  return entry;
}

export function clearSyncedReviews(syncedIds: string[]): void {
  if (typeof window === 'undefined') return;
  const outbox = getOfflineOutbox().filter((item) => !syncedIds.includes(item.id));
  localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(outbox));
  logger.info('Cleared synced review events from outbox', { count: syncedIds.length });
}
