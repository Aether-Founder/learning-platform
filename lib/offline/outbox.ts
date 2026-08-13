import { readStoredJson, writeStoredJson } from '../errors';
import { logger } from '../logger';

export interface OfflineReviewEvent {
  id: string;
  cardId: string;
  studySetId: string;
  grade: 'again' | 'hard' | 'good' | 'easy';
  timestamp: string;
  synced: boolean;
}

const OUTBOX_STORAGE_KEY = 'aether_review_outbox_v1';

export function getOfflineOutbox(): OfflineReviewEvent[] {
  return readStoredJson<OfflineReviewEvent[]>(OUTBOX_STORAGE_KEY, []);
}

export function addReviewToOutbox(event: Omit<OfflineReviewEvent, 'synced'>): OfflineReviewEvent {
  const outbox = getOfflineOutbox();
  const entry: OfflineReviewEvent = { ...event, synced: false };
  outbox.push(entry);
  if (!writeStoredJson(OUTBOX_STORAGE_KEY, outbox)) {
    logger.error('Review event could not be queued for sync', undefined, {
      id: event.id,
      cardId: event.cardId,
    });
    return entry;
  }
  logger.info('Added review event to offline outbox', {
    id: event.id,
    cardId: event.cardId,
    grade: event.grade,
  });
  return entry;
}

/** Returns true when the pruned outbox was persisted. */
export function clearSyncedReviews(syncedIds: string[]): boolean {
  const outbox = getOfflineOutbox().filter((item) => !syncedIds.includes(item.id));
  if (!writeStoredJson(OUTBOX_STORAGE_KEY, outbox)) {
    logger.error('Failed to clear synced review events from outbox', undefined, {
      count: syncedIds.length,
    });
    return false;
  }
  logger.info('Cleared synced review events from outbox', { count: syncedIds.length });
  return true;
}
