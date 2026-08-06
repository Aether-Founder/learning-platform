import { getUserById } from './auth';
import db from './db';

interface SyncData {
  userId: string;
  dataType: string;
  data: any;
  timestamp: number;
  version: number;
}

/**
 * Sync data between local storage and server
 */
export class DataSync {
  private userId: string;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = true;

  constructor(userId: string) {
    this.userId = userId;
    this.setupOnlineStatusListener();
  }

  /**
   * Set up online/offline status listener
   */
  private setupOnlineStatusListener(): void {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.syncAll();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Start automatic sync
   */
  public startAutoSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all data types
   */
  public async syncAll(): Promise<void> {
    if (!this.isOnline) return;

    const dataTypes = ['readingProgress', 'bookmarks', 'studyProgress', 'quizResults'];
    
    for (const dataType of dataTypes) {
      await this.syncDataType(dataType);
    }
  }

  /**
   * Sync a specific data type
   */
  public async syncDataType(dataType: string): Promise<void> {
    try {
      // Get local data
      const localData = this.getLocalData(dataType);
      
      // Get server data
      const serverData = await this.getServerData(dataType);
      
      // Merge data (server takes precedence for conflicts)
      const mergedData = this.mergeData(localData, serverData);
      
      // Save merged data locally
      this.saveLocalData(dataType, mergedData);
      
      // Save merged data to server
      await this.saveServerData(dataType, mergedData);
      
    } catch (error) {
      console.error(`Failed to sync ${dataType}:`, error);
    }
  }

  /**
   * Get data from local storage
   */
  private getLocalData(dataType: string): any {
    if (typeof window === 'undefined') return null;

    try {
      const value = localStorage.getItem(dataType);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Failed to get local ${dataType}:`, error);
      return null;
    }
  }

  /**
   * Save data to local storage
   */
  private saveLocalData(dataType: string, data: any): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(dataType, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save local ${dataType}:`, error);
    }
  }

  /**
   * Get data from server
   */
  private async getServerData(dataType: string): Promise<any> {
    try {
      const stmt = db.prepare(`
        SELECT data_value FROM user_data 
        WHERE user_id = ? AND data_key = ?
        ORDER BY created_at DESC
        LIMIT 1
      `);
      
      const row = stmt.get(this.userId, dataType) as any;
      
      if (row) {
        return JSON.parse(row.data_value);
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to get server ${dataType}:`, error);
      return null;
    }
  }

  /**
   * Save data to server
   */
  private async saveServerData(dataType: string, data: any): Promise<void> {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_data (user_id, data_key, data_value, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(this.userId, dataType, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save server ${dataType}:`, error);
    }
  }

  /**
   * Merge local and server data
   * Server data takes precedence for conflicts
   */
  private mergeData(local: any, server: any): any {
    if (!local) return server;
    if (!server) return local;

    // If both are objects, merge them
    if (typeof local === 'object' && typeof server === 'object' && !Array.isArray(local) && !Array.isArray(server)) {
      return { ...server, ...local };
    }

    // Otherwise, server takes precedence
    return server;
  }

  /**
   * Force sync immediately
   */
  public async forceSync(): Promise<void> {
    await this.syncAll();
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): { isOnline: boolean; lastSync?: Date } {
    return {
      isOnline: this.isOnline,
      lastSync: new Date(), // In a real implementation, track last sync time
    };
  }
}

/**
 * Create a data sync instance for a user
 */
export function createDataSync(userId: string): DataSync {
  return new DataSync(userId);
}
