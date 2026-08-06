import db from "./db";

export interface StudyPlan {
  id: string;
  userId: string;
  testWeekId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export interface StudySession {
  id: string;
  studyPlanId: string;
  subjectId: string;
  scheduledDate: Date;
  duration: number;
  topics?: any;
  completed: boolean;
  actualDuration?: number;
  createdAt: Date;
}

export async function createStudyPlan(
  userId: string,
  testWeekId: string,
  name: string,
  startDate: Date,
  endDate: Date
): Promise<StudyPlan> {
  const id = crypto.randomUUID();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO study_plans (id, user_id, test_week_id, name, start_date, end_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, testWeekId, name, startDate.toISOString(), endDate.toISOString(), now.toISOString());

  return {
    id,
    userId,
    testWeekId,
    name,
    startDate,
    endDate,
    createdAt: now,
  };
}

export async function getStudyPlanById(id: string): Promise<StudyPlan | null> {
  const stmt = db.prepare("SELECT * FROM study_plans WHERE id = ?");
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    testWeekId: row.test_week_id,
    name: row.name,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    createdAt: new Date(row.created_at),
  };
}

export async function getStudyPlansByUser(userId: string): Promise<StudyPlan[]> {
  const stmt = db.prepare("SELECT * FROM study_plans WHERE user_id = ? ORDER BY created_at DESC");
  const rows = stmt.all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    testWeekId: row.test_week_id,
    name: row.name,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    createdAt: new Date(row.created_at),
  }));
}

export async function getStudyPlansByTestWeek(testWeekId: string): Promise<StudyPlan[]> {
  const stmt = db.prepare("SELECT * FROM study_plans WHERE test_week_id = ? ORDER BY created_at DESC");
  const rows = stmt.all(testWeekId) as any[];

  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    testWeekId: row.test_week_id,
    name: row.name,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    createdAt: new Date(row.created_at),
  }));
}

export async function updateStudyPlan(
  id: string,
  name: string | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined
): Promise<StudyPlan | null> {
  const stmt = db.prepare(`
    UPDATE study_plans
    SET name = COALESCE(?, name),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date)
    WHERE id = ?
  `);

  stmt.run(
    name || null,
    startDate ? startDate.toISOString() : null,
    endDate ? endDate.toISOString() : null,
    id
  );

  return getStudyPlanById(id);
}

export async function deleteStudyPlan(id: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM study_plans WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function createStudySession(
  studyPlanId: string,
  subjectId: string,
  scheduledDate: Date,
  duration: number,
  topics: any
): Promise<StudySession> {
  const id = crypto.randomUUID();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO study_sessions (id, study_plan_id, subject_id, scheduled_date, duration, topics, completed, actual_duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, studyPlanId, subjectId, scheduledDate.toISOString(), duration, JSON.stringify(topics || []), 0, null, now.toISOString());

  return {
    id,
    studyPlanId,
    subjectId,
    scheduledDate,
    duration,
    topics: topics || [],
    completed: false,
    actualDuration: undefined,
    createdAt: now,
  };
}

export async function getStudySessionById(id: string): Promise<StudySession | null> {
  const stmt = db.prepare("SELECT * FROM study_sessions WHERE id = ?");
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    studyPlanId: row.study_plan_id,
    subjectId: row.subject_id,
    scheduledDate: new Date(row.scheduled_date),
    duration: row.duration,
    topics: row.topics ? JSON.parse(row.topics) : undefined,
    completed: row.completed === 1,
    actualDuration: row.actual_duration || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function getStudySessionsByPlan(studyPlanId: string): Promise<StudySession[]> {
  const stmt = db.prepare("SELECT * FROM study_sessions WHERE study_plan_id = ? ORDER BY scheduled_date ASC");
  const rows = stmt.all(studyPlanId) as any[];

  return rows.map(row => ({
    id: row.id,
    studyPlanId: row.study_plan_id,
    subjectId: row.subject_id,
    scheduledDate: new Date(row.scheduled_date),
    duration: row.duration,
    topics: row.topics ? JSON.parse(row.topics) : undefined,
    completed: row.completed === 1,
    actualDuration: row.actual_duration || undefined,
    createdAt: new Date(row.created_at),
  }));
}

export async function updateStudySession(
  id: string,
  completed: boolean | undefined,
  actualDuration: number | undefined
): Promise<StudySession | null> {
  const stmt = db.prepare(`
    UPDATE study_sessions
    SET completed = COALESCE(?, completed),
        actual_duration = COALESCE(?, actual_duration)
    WHERE id = ?
  `);

  stmt.run(
    completed !== undefined ? (completed ? 1 : 0) : null,
    actualDuration || null,
    id
  );

  return getStudySessionById(id);
}

export async function deleteStudySession(id: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM study_sessions WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
