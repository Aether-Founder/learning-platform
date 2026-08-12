import db from './db';

export interface Homework {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subject: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  estimatedTime?: number;
  completedAt?: Date;
  testWeekId?: string;
  relatedStudySetId?: string;
  createdAt: Date;
}

export async function createHomework(
  userId: string,
  title: string,
  description: string | undefined,
  subject: string,
  dueDate: Date,
  priority: 'low' | 'medium' | 'high',
  estimatedTime: number | undefined,
  testWeekId: string | undefined,
  relatedStudySetId: string | undefined
): Promise<Homework> {
  const id = crypto.randomUUID();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO homework (id, user_id, title, description, subject, due_date, priority, status, estimated_time, test_week_id, related_study_set_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    title,
    description || null,
    subject,
    dueDate.toISOString(),
    priority,
    'pending',
    estimatedTime || null,
    testWeekId || null,
    relatedStudySetId || null,
    now.toISOString()
  );

  return {
    id,
    userId,
    title,
    description: description || undefined,
    subject,
    dueDate,
    priority,
    status: 'pending',
    estimatedTime: estimatedTime || undefined,
    testWeekId: testWeekId || undefined,
    relatedStudySetId: relatedStudySetId || undefined,
    createdAt: now,
  };
}

export async function getHomeworkById(id: string): Promise<Homework | null> {
  const stmt = db.prepare('SELECT * FROM homework WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    subject: row.subject,
    dueDate: new Date(row.due_date),
    priority: row.priority,
    status: row.status,
    estimatedTime: row.estimated_time || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    testWeekId: row.test_week_id || undefined,
    relatedStudySetId: row.related_study_set_id || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getHomeworkByUserId(userId: string): Promise<Homework[]> {
  const stmt = db.prepare('SELECT * FROM homework WHERE user_id = ? ORDER BY due_date ASC');
  const rows = stmt.all(userId) as any[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    subject: row.subject,
    dueDate: new Date(row.due_date),
    priority: row.priority,
    status: row.status,
    estimatedTime: row.estimated_time || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    testWeekId: row.test_week_id || undefined,
    relatedStudySetId: row.related_study_set_id || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getHomeworkByTestWeek(testWeekId: string): Promise<Homework[]> {
  const stmt = db.prepare('SELECT * FROM homework WHERE test_week_id = ? ORDER BY due_date ASC');
  const rows = stmt.all(testWeekId) as any[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    subject: row.subject,
    dueDate: new Date(row.due_date),
    priority: row.priority,
    status: row.status,
    estimatedTime: row.estimated_time || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    testWeekId: row.test_week_id || undefined,
    relatedStudySetId: row.related_study_set_id || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateHomework(
  id: string,
  title: string | undefined,
  description: string | undefined,
  subject: string | undefined,
  dueDate: Date | undefined,
  priority: 'low' | 'medium' | 'high' | undefined,
  status: 'pending' | 'in_progress' | 'completed' | undefined,
  estimatedTime: number | undefined
): Promise<Homework | null> {
  const now = new Date();
  const completedAt = status === 'completed' ? now : undefined;

  const stmt = db.prepare(`
    UPDATE homework
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        subject = COALESCE(?, subject),
        due_date = COALESCE(?, due_date),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        estimated_time = COALESCE(?, estimated_time),
        completed_at = COALESCE(?, completed_at)
    WHERE id = ?
  `);

  stmt.run(
    title || null,
    description || null,
    subject || null,
    dueDate ? dueDate.toISOString() : null,
    priority || null,
    status || null,
    estimatedTime || null,
    completedAt ? completedAt.toISOString() : null,
    id
  );

  return getHomeworkById(id);
}

export async function deleteHomework(id: string): Promise<boolean> {
  const stmt = db.prepare('DELETE FROM homework WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function getPendingHomework(userId: string): Promise<Homework[]> {
  const stmt = db.prepare(
    "SELECT * FROM homework WHERE user_id = ? AND status != 'completed' ORDER BY due_date ASC"
  );
  const rows = stmt.all(userId) as any[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    subject: row.subject,
    dueDate: new Date(row.due_date),
    priority: row.priority,
    status: row.status,
    estimatedTime: row.estimated_time || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    testWeekId: row.test_week_id || undefined,
    relatedStudySetId: row.related_study_set_id || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function getHomeworkBySubject(userId: string, subject: string): Promise<Homework[]> {
  const stmt = db.prepare(
    'SELECT * FROM homework WHERE user_id = ? AND subject = ? ORDER BY due_date ASC'
  );
  const rows = stmt.all(userId, subject) as any[];

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    subject: row.subject,
    dueDate: new Date(row.due_date),
    priority: row.priority,
    status: row.status,
    estimatedTime: row.estimated_time || undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    testWeekId: row.test_week_id || undefined,
    relatedStudySetId: row.related_study_set_id || undefined,
    createdAt: new Date(row.created_at),
  }));
}
