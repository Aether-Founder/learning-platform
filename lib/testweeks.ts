import db from './db';
import { generateId } from './auth';

export interface TestWeek {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  subjects: TestWeekSubject[];
}

export interface TestWeekSubject {
  id: string;
  testWeekId: string;
  subjectId: string;
  subjectName: string;
  createdAt: string;
}

/**
 * Create a new test week
 */
export function createTestWeek(
  userId: string,
  name: string,
  startDate: string,
  endDate: string
): TestWeek {
  const testWeekId = generateId();
  
  const stmt = db.prepare(`
    INSERT INTO test_weeks (id, user_id, name, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);
  
  stmt.run(testWeekId, userId, name, startDate, endDate);
  
  return getTestWeekById(testWeekId)!;
}

/**
 * Get test week by ID
 */
export function getTestWeekById(testWeekId: string): TestWeek | null {
  const stmt = db.prepare('SELECT * FROM test_weeks WHERE id = ?');
  const testWeekRow = stmt.get(testWeekId) as any;
  
  if (!testWeekRow) return null;
  
  const subjects = getTestWeekSubjects(testWeekId);
  
  return {
    id: testWeekRow.id,
    userId: testWeekRow.user_id,
    name: testWeekRow.name,
    startDate: testWeekRow.start_date,
    endDate: testWeekRow.end_date,
    isActive: testWeekRow.is_active === 1,
    createdAt: testWeekRow.created_at,
    subjects,
  };
}

/**
 * Get all test weeks for a user
 */
export function getTestWeeksByUserId(userId: string): TestWeek[] {
  const stmt = db.prepare('SELECT * FROM test_weeks WHERE user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => {
    const subjects = getTestWeekSubjects(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
      subjects,
    };
  });
}

/**
 * Get active test week for a user
 */
export function getActiveTestWeek(userId: string): TestWeek | null {
  const stmt = db.prepare('SELECT * FROM test_weeks WHERE user_id = ? AND is_active = 1');
  const row = stmt.get(userId) as any;
  
  if (!row) return null;
  
  const subjects = getTestWeekSubjects(row.id);
  
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    subjects,
  };
}

/**
 * Update test week
 */
export function updateTestWeek(
  testWeekId: string,
  updates: Partial<Pick<TestWeek, 'name' | 'startDate' | 'endDate' | 'isActive'>>
): TestWeek | null {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.startDate);
  }
  if (updates.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.endDate);
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  
  if (fields.length === 0) {
    return getTestWeekById(testWeekId);
  }
  
  values.push(testWeekId);
  const stmt = db.prepare(`
    UPDATE test_weeks
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  return getTestWeekById(testWeekId);
}

/**
 * Delete test week
 */
export function deleteTestWeek(testWeekId: string): boolean {
  const stmt = db.prepare('DELETE FROM test_weeks WHERE id = ?');
  const result = stmt.run(testWeekId);
  return result.changes > 0;
}

/**
 * Add subject to test week
 */
export function addSubjectToTestWeek(
  testWeekId: string,
  subjectId: string,
  subjectName: string
): TestWeekSubject {
  const subjectIdDb = generateId();
  
  const stmt = db.prepare(`
    INSERT INTO test_week_subjects (id, test_week_id, subject_id, subject_name)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(subjectIdDb, testWeekId, subjectId, subjectName);
  
  return {
    id: subjectIdDb,
    testWeekId,
    subjectId,
    subjectName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get subjects for a test week
 */
export function getTestWeekSubjects(testWeekId: string): TestWeekSubject[] {
  const stmt = db.prepare('SELECT * FROM test_week_subjects WHERE test_week_id = ?');
  const rows = stmt.all(testWeekId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    testWeekId: row.test_week_id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    createdAt: row.created_at,
  }));
}

/**
 * Remove subject from test week
 */
export function removeSubjectFromTestWeek(subjectId: string): boolean {
  const stmt = db.prepare('DELETE FROM test_week_subjects WHERE id = ?');
  const result = stmt.run(subjectId);
  return result.changes > 0;
}

/**
 * Set active test week for a user
 */
export function setActiveTestWeek(userId: string, testWeekId: string): void {
  // Deactivate all test weeks for the user
  const deactivateStmt = db.prepare('UPDATE test_weeks SET is_active = 0 WHERE user_id = ?');
  deactivateStmt.run(userId);
  
  // Activate the specified test week
  const activateStmt = db.prepare('UPDATE test_weeks SET is_active = 1 WHERE id = ?');
  activateStmt.run(testWeekId);
}
