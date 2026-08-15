import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataSync, createDataSync } from '@/lib/data-sync';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase, db } from '@/test-utils/db';

function readServerData(userId: string, dataType: string) {
  const row = db
    .prepare('SELECT data_value FROM user_data WHERE user_id = ? AND data_key = ?')
    .get(userId, dataType) as { data_value: string } | undefined;
  return row ? JSON.parse(row.data_value) : null;
}

function writeServerData(userId: string, dataType: string, data: unknown) {
  db.prepare(
    'INSERT OR REPLACE INTO user_data (user_id, data_key, data_value) VALUES (?, ?, ?)'
  ).run(userId, dataType, JSON.stringify(data));
}

describe('data-sync', () => {
  let userId: string;
  let sync: DataSync;
  let listeners: Record<string, () => void>;

  beforeEach(async () => {
    resetDatabase();
    localStorage.clear();
    listeners = {};
    // The shared test setup aliases `window` to globalThis, which has no DOM
    // event API; the sync class listens for online/offline transitions.
    (globalThis as unknown as { addEventListener: unknown }).addEventListener = (
      event: string,
      handler: () => void
    ) => {
      listeners[event] = handler;
    };
    vi.stubGlobal('navigator', { onLine: true });

    const user = await createTestUser({ email: 'sync@test.local' });
    userId = user.user.id;
    sync = createDataSync(userId);
  });

  afterEach(() => {
    sync?.stopAutoSync();
    delete (globalThis as unknown as { addEventListener?: unknown }).addEventListener;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('uploads local-only data to the server', async () => {
    localStorage.setItem('bookmarks', JSON.stringify(['a', 'b']));
    await sync.syncDataType('bookmarks');
    expect(readServerData(userId, 'bookmarks')).toEqual(['a', 'b']);
  });

  it('downloads server-only data into local storage', async () => {
    writeServerData(userId, 'readingProgress', { page: 12 });
    await sync.syncDataType('readingProgress');
    expect(JSON.parse(localStorage.getItem('readingProgress') as string)).toEqual({ page: 12 });
  });

  it('merges objects with local values winning on conflicts', async () => {
    writeServerData(userId, 'studyProgress', { chapter: 1, score: 50 });
    localStorage.setItem('studyProgress', JSON.stringify({ score: 90 }));

    await sync.syncDataType('studyProgress');

    const merged = { chapter: 1, score: 90 };
    expect(JSON.parse(localStorage.getItem('studyProgress') as string)).toEqual(merged);
    expect(readServerData(userId, 'studyProgress')).toEqual(merged);
  });

  it('lets the server win when the values are not both plain objects', async () => {
    writeServerData(userId, 'quizResults', ['server']);
    localStorage.setItem('quizResults', JSON.stringify(['local']));
    await sync.syncDataType('quizResults');
    expect(JSON.parse(localStorage.getItem('quizResults') as string)).toEqual(['server']);
  });

  it('keeps corrupt local data from breaking the sync', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    writeServerData(userId, 'bookmarks', ['server']);
    localStorage.setItem('bookmarks', '{not-json');
    await sync.syncDataType('bookmarks');
    expect(JSON.parse(localStorage.getItem('bookmarks') as string)).toEqual(['server']);
  });

  it('syncs every known data type', async () => {
    localStorage.setItem('bookmarks', JSON.stringify(['a']));
    localStorage.setItem('readingProgress', JSON.stringify({ page: 1 }));
    localStorage.setItem('studyProgress', JSON.stringify({ done: true }));
    localStorage.setItem('quizResults', JSON.stringify([{ score: 8 }]));

    await sync.forceSync();

    expect(readServerData(userId, 'bookmarks')).toEqual(['a']);
    expect(readServerData(userId, 'readingProgress')).toEqual({ page: 1 });
    expect(readServerData(userId, 'studyProgress')).toEqual({ done: true });
    expect(readServerData(userId, 'quizResults')).toEqual([{ score: 8 }]);
  });

  it('reports the online status', () => {
    const status = sync.getSyncStatus();
    expect(status.isOnline).toBe(true);
    expect(status.lastSync).toBeInstanceOf(Date);
  });

  it('skips syncing while offline and resumes when back online', async () => {
    const syncDataType = vi.spyOn(sync, 'syncDataType').mockResolvedValue();

    listeners.offline();
    await sync.syncAll();
    expect(syncDataType).not.toHaveBeenCalled();
    expect(sync.getSyncStatus().isOnline).toBe(false);

    listeners.online();
    expect(sync.getSyncStatus().isOnline).toBe(true);
    expect(syncDataType).toHaveBeenCalled();
  });

  it('runs the sync on the configured interval and stops on demand', async () => {
    vi.useFakeTimers();
    const syncAll = vi.spyOn(sync, 'syncAll').mockResolvedValue();

    sync.startAutoSync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(syncAll).toHaveBeenCalledTimes(2);

    sync.stopAutoSync();
    await vi.advanceTimersByTimeAsync(3000);
    expect(syncAll).toHaveBeenCalledTimes(2);
  });

  it('replaces a running interval when auto sync is restarted', async () => {
    vi.useFakeTimers();
    const syncAll = vi.spyOn(sync, 'syncAll').mockResolvedValue();

    sync.startAutoSync(1000);
    sync.startAutoSync(2000);
    await vi.advanceTimersByTimeAsync(2000);
    expect(syncAll).toHaveBeenCalledTimes(1);
  });
});
