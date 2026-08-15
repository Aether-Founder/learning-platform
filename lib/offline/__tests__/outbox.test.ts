import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addReviewToOutbox,
  clearSyncedReviews,
  getOfflineOutbox,
  type OfflineReviewEvent,
} from '@/lib/offline/outbox';

const OUTBOX_STORAGE_KEY = 'aether_review_outbox_v1';

function makeEvent(id: string): Omit<OfflineReviewEvent, 'synced'> {
  return {
    id,
    cardId: `card-${id}`,
    studySetId: 'set-1',
    grade: 'good',
    timestamp: '2024-05-01T12:00:00.000Z',
  };
}

describe('offline outbox', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts empty', () => {
    expect(getOfflineOutbox()).toEqual([]);
  });

  it('appends events as unsynced and persists them', () => {
    const entry = addReviewToOutbox(makeEvent('a'));
    expect(entry.synced).toBe(false);
    addReviewToOutbox(makeEvent('b'));

    const stored = getOfflineOutbox();
    expect(stored.map((item) => item.id)).toEqual(['a', 'b']);
    expect(stored.every((item) => item.synced === false)).toBe(true);
    expect(localStorage.getItem(OUTBOX_STORAGE_KEY)).toContain('"cardId":"card-a"');
  });

  it('removes only the synced events', () => {
    addReviewToOutbox(makeEvent('a'));
    addReviewToOutbox(makeEvent('b'));
    addReviewToOutbox(makeEvent('c'));

    clearSyncedReviews(['a', 'c']);
    expect(getOfflineOutbox().map((item) => item.id)).toEqual(['b']);
  });

  it('is a no-op when clearing ids that are not queued', () => {
    addReviewToOutbox(makeEvent('a'));
    clearSyncedReviews(['unknown']);
    expect(getOfflineOutbox()).toHaveLength(1);
  });

  it('recovers from a corrupt payload', () => {
    localStorage.setItem(OUTBOX_STORAGE_KEY, '{not-json');
    expect(getOfflineOutbox()).toEqual([]);
  });

  it('does nothing on the server where there is no window', () => {
    vi.stubGlobal('window', undefined);
    expect(getOfflineOutbox()).toEqual([]);
    clearSyncedReviews(['a']);
    expect(localStorage.getItem(OUTBOX_STORAGE_KEY)).toBeNull();
  });
});
