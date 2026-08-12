import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportUserData,
  importUserData,
  migrateLocalStorageToAccount,
  clearLocalStorageData,
} from '@/lib/data-migration';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase, db } from '@/test-utils/db';

describe('data-migration', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    localStorage.clear();
    const user = await createTestUser({ email: 'migrate@test.local' });
    userId = user.user.id;
  });

  it('exports empty data for a new user', async () => {
    expect(await exportUserData(userId)).toEqual({});
  });

  it('imports and exports user data', async () => {
    await importUserData(userId, { readingProgress: { page: 5 }, bookmarks: ['a'] });
    const data = await exportUserData(userId);
    expect(data.readingProgress).toEqual({ page: 5 });
    expect(data.bookmarks).toEqual(['a']);
  });

  it('overwrites existing keys on re-import', async () => {
    await importUserData(userId, { readingProgress: { page: 1 } });
    await importUserData(userId, { readingProgress: { page: 99 } });
    const data = await exportUserData(userId);
    expect(data.readingProgress).toEqual({ page: 99 });
  });

  it('migrates localStorage keys into user_data', async () => {
    localStorage.setItem('readingProgress', JSON.stringify({ page: 42 }));
    localStorage.setItem('bookmarks', JSON.stringify(['x', 'y']));
    await migrateLocalStorageToAccount(userId);

    const rows = db
      .prepare('SELECT data_key FROM user_data WHERE user_id = ?')
      .all(userId) as Array<{ data_key: string }>;
    const keys = rows.map((r) => r.data_key);
    expect(keys).toContain('readingProgress');
    expect(keys).toContain('bookmarks');
  });

  it('clears migrated localStorage keys', () => {
    localStorage.setItem('readingProgress', '{}');
    localStorage.setItem('bookmarks', '[]');
    localStorage.setItem('unrelated', 'keep');
    clearLocalStorageData();
    expect(localStorage.getItem('readingProgress')).toBeNull();
    expect(localStorage.getItem('bookmarks')).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
