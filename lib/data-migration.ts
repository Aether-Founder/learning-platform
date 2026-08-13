import { getUserById } from './auth';
import db from './db';
import { getErrorMessage } from './errors';
import { logger } from './logger';

interface LocalStorageData {
  user_data?: {
    name: string;
    email: string;
  };
  user_credentials?: {
    name: string;
    email: string;
    password: string;
    rememberMe: boolean;
  };
  readingProgress?: Record<string, any>;
  bookmarks?: Record<string, any>;
  [key: string]: any;
}

export interface MigrationResult {
  /** Keys that were written to the database. */
  migratedKeys: string[];
  /** Keys that could not be read or written, with the reason. */
  failedKeys: Array<{ key: string; reason: string }>;
}

/**
 * Migrate existing localStorage data to user account
 * This should be called when a user first registers/logs in
 */
export async function migrateLocalStorageToAccount(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = { migratedKeys: [], failedKeys: [] };
  if (typeof window === 'undefined') return result;

  const user = getUserById(userId);
  if (!user) {
    throw new Error(`Cannot migrate data: unknown user ${userId}`);
  }

  const localStorageData: LocalStorageData = {};

  // Get specific keys that we want to migrate
  const keysToMigrate = [
    'readingProgress',
    'bookmarks',
    'studyProgress',
    'quizResults',
    'analytics',
  ];

  keysToMigrate.forEach((key) => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        localStorageData[key] = JSON.parse(value);
      }
    } catch (error) {
      result.failedKeys.push({ key, reason: getErrorMessage(error) });
      logger.error('Failed to read localStorage key during migration', error, { userId, key });
    }
  });

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  Object.entries(localStorageData).forEach(([key, value]) => {
    if (value) {
      stmt.run(userId, key, JSON.stringify(value));
      result.migratedKeys.push(key);
    }
  });

  logger.info('Data migration completed', {
    userId,
    migrated: result.migratedKeys.length,
    failed: result.failedKeys.length,
  });

  return result;
}

/**
 * Export user data for backup
 */
export async function exportUserData(userId: string): Promise<Record<string, any>> {
  const stmt = db.prepare('SELECT data_key, data_value FROM user_data WHERE user_id = ?');
  const rows = stmt.all(userId) as any[];

  const userData: Record<string, any> = {};
  rows.forEach((row) => {
    try {
      userData[row.data_key] = JSON.parse(row.data_value);
    } catch (error) {
      // Legacy rows may hold plain strings; keep the raw value but record why.
      logger.warn('Stored user data is not valid JSON, exporting raw value', {
        userId,
        key: row.data_key,
        reason: getErrorMessage(error),
      });
      userData[row.data_key] = row.data_value;
    }
  });

  return userData;
}

/**
 * Import user data from backup
 */
export async function importUserData(
  userId: string,
  data: Record<string, any>
): Promise<MigrationResult> {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result: MigrationResult = { migratedKeys: [], failedKeys: [] };

  Object.entries(data).forEach(([key, value]) => {
    try {
      stmt.run(userId, key, JSON.stringify(value));
      result.migratedKeys.push(key);
    } catch (error) {
      result.failedKeys.push({ key, reason: getErrorMessage(error) });
      logger.error('Failed to import user data key', error, { userId, key });
    }
  });

  return result;
}

/**
 * Clear migrated data from localStorage
 */
export function clearLocalStorageData(): void {
  if (typeof window === 'undefined') return;

  const keysToClear = [
    'readingProgress',
    'bookmarks',
    'studyProgress',
    'quizResults',
    'analytics',
    'user_credentials',
    'user_data',
  ];

  keysToClear.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error('Failed to clear migrated localStorage key', error, { key });
    }
  });
}
