import { supabase } from '@/lib/supabase/client';
import { OfflineStorage, LocalStudySet, LocalStudySession } from './storage';

export class SyncManager {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;

  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingItems();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Sync every 5 minutes when online
    setInterval(
      () => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncPendingItems();
        }
      },
      5 * 60 * 1000
    );
  }

  static async syncPendingItems(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('Starting sync...');

    try {
      const pending = await OfflineStorage.getPendingSyncItems();

      // Sync study sets
      for (const studySet of pending.studySets) {
        await this.syncStudySet(studySet);
      }

      // Sync notes (skip for now - table doesn't exist in schema)
      // Sync tasks (skip for now - table doesn't exist in schema)
      // Sync study sessions
      for (const session of pending.studySessions) {
        await this.syncStudySession(session);
      }

      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private static async syncStudySet(studySet: LocalStudySet): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (studySet.remote_id) {
        // Update existing
        const { error } = await supabase
          .from('study_sets' as any)
          .update({
            title: studySet.title,
            description: studySet.description,
            updated_at: studySet.updated_at,
          })
          .eq('id', studySet.remote_id);

        if (!error) {
          await OfflineStorage.markAsSynced('studySets', studySet.id!, studySet.remote_id);
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('study_sets' as any)
          .insert({
            user_id: user.id,
            title: studySet.title,
            description: studySet.description,
          })
          .select()
          .single();

        if (!error && data) {
          const remoteData = data as unknown as { id: string };
          await OfflineStorage.markAsSynced('studySets', studySet.id!, remoteData.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync study set:', error);
    }
  }

  private static async syncStudySession(session: LocalStudySession): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (session.remote_id) {
        // Update existing
        const { error } = await supabase
          .from('study_sessions' as any)
          .update({
            cards_studied: session.cards_studied,
            correct_answers: session.correct_answers,
            duration_minutes: session.duration_minutes,
          })
          .eq('id', session.remote_id);

        if (!error) {
          await OfflineStorage.markAsSynced('studySessions', session.id!, session.remote_id);
        }
      } else {
        // Create new
        const { data, error } = await supabase
          .from('study_sessions' as any)
          .insert({
            user_id: user.id,
            study_set_id: session.study_set_id,
            cards_studied: session.cards_studied,
            correct_answers: session.correct_answers,
            duration_minutes: session.duration_minutes,
            date: session.date,
          })
          .select()
          .single();

        if (!error && data) {
          const remoteData = data as unknown as { id: string };
          await OfflineStorage.markAsSynced('studySessions', session.id!, remoteData.id);
        }
      }
    } catch (error) {
      console.error('Failed to sync study session:', error);
    }
  }

  static async downloadFromSupabase(userId: string): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Download study sets
      const { data: studySets } = await supabase
        .from('study_sets' as any)
        .select('*')
        .eq('user_id', userId);

      if (studySets) {
        for (const set of studySets as any) {
          await OfflineStorage.saveStudySet({
            id: crypto.randomUUID(),
            user_id: set.user_id,
            title: set.title,
            description: set.description || '',
            cards: [],
            subject: set.subject_id || undefined,
            created_at: set.created_at,
            updated_at: set.updated_at,
            sync_status: 'synced',
            remote_id: set.id,
          });
        }
      }

      console.log('Download from Supabase completed');
    } catch (error) {
      console.error('Failed to download from Supabase:', error);
    }
  }

  static isOnlineStatus(): boolean {
    return this.isOnline;
  }
}
