import Dexie, { Table } from 'dexie';

export interface LocalStudySet {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  cards: LocalCard[];
  subject?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  remote_id?: string;
}

export interface LocalCard {
  id?: string;
  question: string;
  answer: string;
  tags?: string[];
}

export interface LocalNote {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  type: 'page' | 'map';
  parent_id?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  remote_id?: string;
}

export interface LocalTask {
  id?: string;
  user_id: string;
  title: string;
  description: string;
  status: 'todo' | 'bezig' | 'review' | 'klaar';
  subject?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  remote_id?: string;
}

export interface LocalStudySession {
  id?: string;
  user_id: string;
  study_set_id: string;
  cards_studied: number;
  correct_answers: number;
  duration_minutes: number;
  date: string;
  sync_status: 'synced' | 'pending' | 'conflict';
  remote_id?: string;
}

class OfflineDatabase extends Dexie {
  studySets!: Table<LocalStudySet>;
  notes!: Table<LocalNote>;
  tasks!: Table<LocalTask>;
  studySessions!: Table<LocalStudySession>;

  constructor() {
    super('AetherLearnDB');
    this.version(1).stores({
      studySets: 'id, user_id, title, sync_status, remote_id',
      notes: 'id, user_id, title, type, parent_id, sync_status, remote_id',
      tasks: 'id, user_id, status, sync_status, remote_id',
      studySessions: 'id, user_id, study_set_id, date, sync_status, remote_id',
    });
  }
}

export const db = new OfflineDatabase();

export class OfflineStorage {
  static async saveStudySet(studySet: LocalStudySet): Promise<string> {
    studySet.sync_status = 'pending';
    studySet.updated_at = new Date().toISOString();

    const id = await db.studySets.put(studySet);
    return id.toString();
  }

  static async getStudySets(userId: string): Promise<LocalStudySet[]> {
    return await db.studySets.where('user_id').equals(userId).toArray();
  }

  static async getStudySet(id: string): Promise<LocalStudySet | undefined> {
    return await db.studySets.get(id);
  }

  static async deleteStudySet(id: string): Promise<void> {
    await db.studySets.delete(id);
  }

  static async saveNote(note: LocalNote): Promise<string> {
    note.sync_status = 'pending';
    note.updated_at = new Date().toISOString();

    const id = await db.notes.put(note);
    return id.toString();
  }

  static async getNotes(userId: string): Promise<LocalNote[]> {
    return await db.notes.where('user_id').equals(userId).toArray();
  }

  static async getNote(id: string): Promise<LocalNote | undefined> {
    return await db.notes.get(id);
  }

  static async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  static async saveTask(task: LocalTask): Promise<string> {
    task.sync_status = 'pending';
    task.updated_at = new Date().toISOString();

    const id = await db.tasks.put(task);
    return id.toString();
  }

  static async getTasks(userId: string): Promise<LocalTask[]> {
    return await db.tasks.where('user_id').equals(userId).toArray();
  }

  static async getTask(id: string): Promise<LocalTask | undefined> {
    return await db.tasks.get(id);
  }

  static async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  }

  static async saveStudySession(session: LocalStudySession): Promise<string> {
    session.sync_status = 'pending';

    const id = await db.studySessions.put(session);
    return id.toString();
  }

  static async getStudySessions(userId: string): Promise<LocalStudySession[]> {
    return await db.studySessions.where('user_id').equals(userId).toArray();
  }

  static async getPendingSyncItems(): Promise<{
    studySets: LocalStudySet[];
    notes: LocalNote[];
    tasks: LocalTask[];
    studySessions: LocalStudySession[];
  }> {
    const [studySets, notes, tasks, studySessions] = await Promise.all([
      db.studySets.where('sync_status').equals('pending').toArray(),
      db.notes.where('sync_status').equals('pending').toArray(),
      db.tasks.where('sync_status').equals('pending').toArray(),
      db.studySessions.where('sync_status').equals('pending').toArray(),
    ]);

    return { studySets, notes, tasks, studySessions };
  }

  static async markAsSynced(
    table: 'studySets' | 'notes' | 'tasks' | 'studySessions',
    localId: string,
    remoteId: string
  ): Promise<void> {
    await db[table].update(localId, { sync_status: 'synced' as const, remote_id: remoteId });
  }

  static async clearAll(): Promise<void> {
    await db.studySets.clear();
    await db.notes.clear();
    await db.tasks.clear();
    await db.studySessions.clear();
  }
}
