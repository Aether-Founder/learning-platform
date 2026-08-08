import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTestWeek,
  getTestWeekById,
  getTestWeeksByUserId,
  getActiveTestWeek,
  updateTestWeek,
  deleteTestWeek,
  addSubjectToTestWeek,
  getTestWeekSubjects,
  removeSubjectFromTestWeek,
  setActiveTestWeek,
} from '@/lib/testweeks';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('testweeks', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'tw@test.local' });
    userId = user.user.id;
  });

  it('creates an active test week', () => {
    const week = createTestWeek(userId, 'Toetsweek 1', '2026-01-12', '2026-01-16');
    expect(week.id).toBeTruthy();
    expect(week.name).toBe('Toetsweek 1');
    expect(week.isActive).toBe(true);
    expect(week.subjects).toEqual([]);
  });

  it('gets test week by id and returns null for missing', () => {
    const week = createTestWeek(userId, 'TW', '2026-01-12', '2026-01-16');
    expect(getTestWeekById(week.id)?.name).toBe('TW');
    expect(getTestWeekById('ghost')).toBeNull();
  });

  it('lists test weeks per user', () => {
    createTestWeek(userId, 'TW 1', '2026-01-12', '2026-01-16');
    createTestWeek(userId, 'TW 2', '2026-02-01', '2026-02-05');
    expect(getTestWeeksByUserId(userId)).toHaveLength(2);
  });

  it('updates a test week', () => {
    const week = createTestWeek(userId, 'TW', '2026-01-12', '2026-01-16');
    const updated = updateTestWeek(week.id, { name: 'Nieuwe naam', isActive: false });
    expect(updated?.name).toBe('Nieuwe naam');
    expect(updated?.isActive).toBe(false);
  });

  it('deletes a test week', () => {
    const week = createTestWeek(userId, 'TW', '2026-01-12', '2026-01-16');
    expect(deleteTestWeek(week.id)).toBe(true);
    expect(deleteTestWeek(week.id)).toBe(false);
  });

  it('manages subjects', () => {
    const week = createTestWeek(userId, 'TW', '2026-01-12', '2026-01-16');
    const subject = addSubjectToTestWeek(week.id, 'subj-1', 'Wiskunde');
    expect(subject.subjectName).toBe('Wiskunde');
    expect(getTestWeekSubjects(week.id)).toHaveLength(1);
    expect(removeSubjectFromTestWeek(subject.id)).toBe(true);
    expect(getTestWeekSubjects(week.id)).toHaveLength(0);
  });

  it('sets a single active test week', () => {
    const a = createTestWeek(userId, 'TW A', '2026-01-12', '2026-01-16');
    const b = createTestWeek(userId, 'TW B', '2026-02-01', '2026-02-05');
    setActiveTestWeek(userId, b.id);
    expect(getActiveTestWeek(userId)?.id).toBe(b.id);
    expect(getTestWeekById(a.id)?.isActive).toBe(false);
  });
});
