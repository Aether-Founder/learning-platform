import { getUserById } from './auth';
import db from './db';

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

/**
 * Migrate existing localStorage data to user account
 * This should be called when a user first registers/logs in
 */
export async function migrateLocalStorageToAccount(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const user = getUserById(userId);
    if (!user) return;

    // Get all localStorage data
    const localStorageData: LocalStorageData = {};
    
    // Get specific keys that we want to migrate
    const keysToMigrate = [
      'readingProgress',
      'bookmarks',
      'studyProgress',
      'quizResults',
      'analytics',
    ];

    keysToMigrate.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          localStorageData[key] = JSON.parse(value);
        }
      } catch (error) {
        console.error(`Failed to migrate ${key}:`, error);
      }
    });

    // Store migrated data in database
    // This would be stored in a user_data table or similar
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    Object.entries(localStorageData).forEach(([key, value]) => {
      if (value) {
        stmt.run(userId, key, JSON.stringify(value));
      }
    });

    console.log('Data migration completed for user:', userId);
  } catch (error) {
    console.error('Data migration failed:', error);
  }
}

/**
 * Export user data for backup
 */
export async function exportUserData(userId: string): Promise<Record<string, any>> {
  const stmt = db.prepare('SELECT data_key, data_value FROM user_data WHERE user_id = ?');
  const rows = stmt.all(userId) as any[];

  const userData: Record<string, any> = {};
  rows.forEach(row => {
    try {
      userData[row.data_key] = JSON.parse(row.data_value);
    } catch (error) {
      userData[row.data_key] = row.data_value;
    }
  });

  return userData;
}

/**
 * Import user data from backup
 */
export async function importUserData(userId: string, data: Record<string, any>): Promise<void> {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);

  Object.entries(data).forEach(([key, value]) => {
    try {
      stmt.run(userId, key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to import ${key}:`, error);
    }
  });
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

  keysToClear.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
    }
  });
}
