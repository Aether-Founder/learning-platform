import db from './db';
import { generateId } from './auth';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location?: string;
  color?: string;
  reminderMinutes?: number;
  recurrence?: string;
  testWeekId?: string;
  subjectId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new calendar event
 */
export function createCalendarEvent(
  userId: string,
  eventData: Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): CalendarEvent {
  const eventId = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO calendar_events (
      id, user_id, title, description, start_date, end_date, 
      all_day, location, color, reminder_minutes, recurrence,
      test_week_id, subject_id, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    eventId,
    userId,
    eventData.title,
    eventData.description || null,
    eventData.startDate,
    eventData.endDate,
    eventData.allDay ? 1 : 0,
    eventData.location || null,
    eventData.color || null,
    eventData.reminderMinutes || null,
    eventData.recurrence || null,
    eventData.testWeekId || null,
    eventData.subjectId || null,
    now,
    now
  );
  
  return getCalendarEventById(eventId)!;
}

/**
 * Get calendar event by ID
 */
export function getCalendarEventById(eventId: string): CalendarEvent | null {
  const stmt = db.prepare('SELECT * FROM calendar_events WHERE id = ?');
  const row = stmt.get(eventId) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day === 1,
    location: row.location,
    color: row.color,
    reminderMinutes: row.reminder_minutes,
    recurrence: row.recurrence,
    testWeekId: row.test_week_id,
    subjectId: row.subject_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all calendar events for a user within a date range
 */
export function getCalendarEventsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): CalendarEvent[] {
  const stmt = db.prepare(`
    SELECT * FROM calendar_events 
    WHERE user_id = ? 
    AND start_date >= ? 
    AND end_date <= ?
    ORDER BY start_date ASC
  `);
  
  const rows = stmt.all(userId, startDate, endDate) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day === 1,
    location: row.location,
    color: row.color,
    reminderMinutes: row.reminder_minutes,
    recurrence: row.recurrence,
    testWeekId: row.test_week_id,
    subjectId: row.subject_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get all calendar events for a user
 */
export function getCalendarEventsByUserId(userId: string): CalendarEvent[] {
  const stmt = db.prepare(`
    SELECT * FROM calendar_events 
    WHERE user_id = ? 
    ORDER BY start_date ASC
  `);
  
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day === 1,
    location: row.location,
    color: row.color,
    reminderMinutes: row.reminder_minutes,
    recurrence: row.recurrence,
    testWeekId: row.test_week_id,
    subjectId: row.subject_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Update calendar event
 */
export function updateCalendarEvent(
  eventId: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): CalendarEvent | null {
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.startDate);
  }
  if (updates.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.endDate);
  }
  if (updates.allDay !== undefined) {
    fields.push('all_day = ?');
    values.push(updates.allDay ? 1 : 0);
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(updates.location);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.reminderMinutes !== undefined) {
    fields.push('reminder_minutes = ?');
    values.push(updates.reminderMinutes);
  }
  if (updates.recurrence !== undefined) {
    fields.push('recurrence = ?');
    values.push(updates.recurrence);
  }
  if (updates.testWeekId !== undefined) {
    fields.push('test_week_id = ?');
    values.push(updates.testWeekId);
  }
  if (updates.subjectId !== undefined) {
    fields.push('subject_id = ?');
    values.push(updates.subjectId);
  }
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(eventId);
  
  const stmt = db.prepare(`
    UPDATE calendar_events
    SET ${fields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  return getCalendarEventById(eventId);
}

/**
 * Delete calendar event
 */
export function deleteCalendarEvent(eventId: string): boolean {
  const stmt = db.prepare('DELETE FROM calendar_events WHERE id = ?');
  const result = stmt.run(eventId);
  return result.changes > 0;
}

/**
 * Get events for a specific test week
 */
export function getEventsByTestWeek(testWeekId: string): CalendarEvent[] {
  const stmt = db.prepare(`
    SELECT * FROM calendar_events 
    WHERE test_week_id = ? 
    ORDER BY start_date ASC
  `);
  
  const rows = stmt.all(testWeekId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: row.all_day === 1,
    location: row.location,
    color: row.color,
    reminderMinutes: row.reminder_minutes,
    recurrence: row.recurrence,
    testWeekId: row.test_week_id,
    subjectId: row.subject_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
