import db from "./db";

export interface Class {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
  role: "teacher" | "student";
  joinedAt: Date;
}

export interface Assignment {
  id: string;
  classId: string;
  studySetId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createClass(
  name: string,
  description: string | undefined,
  teacherId: string
): Promise<Class> {
  const id = crypto.randomUUID();
  const code = generateClassCode();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO classes (id, name, description, teacher_id, code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, name, description || null, teacherId, code, now.toISOString(), now.toISOString());

  // Add teacher as member
  await addClassMember(id, teacherId, "teacher");

  return {
    id,
    name,
    description: description || undefined,
    teacherId,
    code,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getClassById(id: string): Promise<Class | null> {
  const stmt = db.prepare("SELECT * FROM classes WHERE id = ?");
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    teacherId: row.teacher_id,
    code: row.code,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getClassByCode(code: string): Promise<Class | null> {
  const stmt = db.prepare("SELECT * FROM classes WHERE code = ?");
  const row = stmt.get(code) as any;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    teacherId: row.teacher_id,
    code: row.code,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getClassesByTeacher(teacherId: string): Promise<Class[]> {
  const stmt = db.prepare("SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC");
  const rows = stmt.all(teacherId) as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    teacherId: row.teacher_id,
    code: row.code,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getClassesByStudent(userId: string): Promise<Class[]> {
  const stmt = db.prepare(`
    SELECT c.* FROM classes c
    INNER JOIN class_members cm ON c.id = cm.class_id
    WHERE cm.user_id = ? AND cm.role = 'student'
    ORDER BY c.created_at DESC
  `);
  const rows = stmt.all(userId) as any[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    teacherId: row.teacher_id,
    code: row.code,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function updateClass(
  id: string,
  name: string | undefined,
  description: string | undefined
): Promise<Class | null> {
  const now = new Date();

  const stmt = db.prepare(`
    UPDATE classes
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(name || null, description || null, now.toISOString(), id);

  return getClassById(id);
}

export async function deleteClass(id: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM classes WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function addClassMember(
  classId: string,
  userId: string,
  role: "teacher" | "student"
): Promise<ClassMember> {
  const id = crypto.randomUUID();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO class_members (id, class_id, user_id, role, joined_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, classId, userId, role, now.toISOString());

  return {
    id,
    classId,
    userId,
    role,
    joinedAt: now,
  };
}

export async function getClassMembers(classId: string): Promise<ClassMember[]> {
  const stmt = db.prepare("SELECT * FROM class_members WHERE class_id = ? ORDER BY joined_at ASC");
  const rows = stmt.all(classId) as any[];

  return rows.map(row => ({
    id: row.id,
    classId: row.class_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: new Date(row.joined_at),
  }));
}

export async function removeClassMember(classId: string, userId: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM class_members WHERE class_id = ? AND user_id = ?");
  const result = stmt.run(classId, userId);
  return result.changes > 0;
}

export async function createAssignment(
  classId: string,
  studySetId: string,
  title: string,
  description: string | undefined,
  dueDate: Date | undefined
): Promise<Assignment> {
  const id = crypto.randomUUID();
  const now = new Date();

  const stmt = db.prepare(`
    INSERT INTO assignments (id, class_id, study_set_id, title, description, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    classId,
    studySetId,
    title,
    description || null,
    dueDate ? dueDate.toISOString() : null,
    now.toISOString(),
    now.toISOString()
  );

  return {
    id,
    classId,
    studySetId,
    title,
    description: description || undefined,
    dueDate: dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getAssignmentsByClass(classId: string): Promise<Assignment[]> {
  const stmt = db.prepare("SELECT * FROM assignments WHERE class_id = ? ORDER BY created_at DESC");
  const rows = stmt.all(classId) as any[];

  return rows.map(row => ({
    id: row.id,
    classId: row.class_id,
    studySetId: row.study_set_id,
    title: row.title,
    description: row.description || undefined,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const stmt = db.prepare("SELECT * FROM assignments WHERE id = ?");
  const row = stmt.get(id) as any;

  if (!row) return null;

  return {
    id: row.id,
    classId: row.class_id,
    studySetId: row.study_set_id,
    title: row.title,
    description: row.description || undefined,
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function updateAssignment(
  id: string,
  title: string | undefined,
  description: string | undefined,
  dueDate: Date | undefined
): Promise<Assignment | null> {
  const now = new Date();

  const stmt = db.prepare(`
    UPDATE assignments
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        due_date = COALESCE(?, due_date),
        updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    title || null,
    description || null,
    dueDate ? dueDate.toISOString() : null,
    now.toISOString(),
    id
  );

  return getAssignmentById(id);
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM assignments WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
