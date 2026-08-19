import { describe, it, expect, beforeEach } from 'vitest';
import {
  createClass,
  getClassById,
  getClassByCode,
  getClassesByTeacher,
  getClassesByStudent,
  updateClass,
  deleteClass,
  addClassMember,
  getClassMembers,
  removeClassMember,
  createAssignment,
  getAssignmentsByClass,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '@/lib/classes';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('classes', () => {
  let teacherId: string;
  let studentId: string;

  beforeEach(async () => {
    resetDatabase();
    const teacher = await createTestUser({ email: 'teacher@test.local' });
    teacherId = teacher.user.id;
    const student = await createTestUser({ email: 'student@test.local' });
    studentId = student.user.id;
  });

  it('creates a class with a code and teacher membership', async () => {
    const cls = await createClass('Klas 1A', 'Wiskunde groep', teacherId);
    expect(cls.id).toBeTruthy();
    expect(cls.code).toHaveLength(6);
    expect(cls.teacherId).toBe(teacherId);
    const members = await getClassMembers(cls.id);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('teacher');
  });

  it('looks up classes by id and code', async () => {
    const cls = await createClass('Klas A', undefined, teacherId);
    expect((await getClassById(cls.id))?.name).toBe('Klas A');
    expect((await getClassByCode(cls.code))?.id).toBe(cls.id);
    expect(await getClassById('ghost')).toBeNull();
    expect(await getClassByCode('NOPE')).toBeNull();
  });

  it('lists classes by teacher and student', async () => {
    const cls = await createClass('Klas A', undefined, teacherId);
    await addClassMember(cls.id, studentId, 'student');
    expect(await getClassesByTeacher(teacherId)).toHaveLength(1);
    expect(await getClassesByStudent(studentId)).toHaveLength(1);
  });

  it('updates and deletes a class', async () => {
    const cls = await createClass('Klas A', undefined, teacherId);
    const updated = await updateClass(cls.id, 'Klas B', 'Nieuwe beschrijving');
    expect(updated?.name).toBe('Klas B');
    expect(updated?.description).toBe('Nieuwe beschrijving');
    expect(await deleteClass(cls.id)).toBe(true);
    expect(await deleteClass(cls.id)).toBe(false);
  });

  it('manages members', async () => {
    const cls = await createClass('Klas A', undefined, teacherId);
    const member = await addClassMember(cls.id, studentId, 'student');
    expect(member.role).toBe('student');
    expect((await getClassMembers(cls.id)).length).toBe(2);
    expect(await removeClassMember(cls.id, studentId)).toBe(true);
    expect(await removeClassMember(cls.id, studentId)).toBe(false);
  });

  it('manages assignments', async () => {
    const cls = await createClass('Klas A', undefined, teacherId);
    const assignment = await createAssignment(
      cls.id,
      'set-1',
      'Opdracht 1',
      'Maak hoofdstuk 2',
      new Date('2026-01-20T00:00:00Z')
    );
    expect(assignment.title).toBe('Opdracht 1');
    expect(await getAssignmentsByClass(cls.id)).toHaveLength(1);
    expect((await getAssignmentById(assignment.id))?.description).toBe('Maak hoofdstuk 2');

    const updated = await updateAssignment(
      assignment.id,
      'Opdracht 1 herzien',
      undefined,
      undefined
    );
    expect(updated?.title).toBe('Opdracht 1 herzien');
    expect(await getAssignmentById('ghost')).toBeNull();

    expect(await deleteAssignment(assignment.id)).toBe(true);
    expect(await deleteAssignment(assignment.id)).toBe(false);
  });
});
