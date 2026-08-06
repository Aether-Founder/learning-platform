import db from './db';
import { generateId } from './auth';

export interface Content {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'study_set' | 'notes' | 'reference';
  data: any; // JSON content
  tags?: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create new content
 */
export function createContent(
  userId: string,
  title: string,
  type: 'study_set' | 'notes' | 'reference',
  data: any,
  description?: string,
  tags?: string[],
  isPublic: boolean = false
): Content {
  const contentId = generateId();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO content (id, user_id, title, description, type, data, tags, is_public, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    contentId,
    userId,
    title,
    description || null,
    type,
    JSON.stringify(data),
    tags ? JSON.stringify(tags) : null,
    isPublic ? 1 : 0,
    now,
    now
  );
  
  return getContentById(contentId)!;
}

/**
 * Get content by ID
 */
export function getContentById(id: string): Content | null {
  const stmt = db.prepare('SELECT * FROM content WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    data: JSON.parse(row.data),
    tags: row.tags ? JSON.parse(row.tags) : [],
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all content by user ID
 */
export function getContentByUserId(userId: string): Content[] {
  const stmt = db.prepare('SELECT * FROM content WHERE user_id = ? ORDER BY updated_at DESC');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    data: JSON.parse(row.data),
    tags: row.tags ? JSON.parse(row.tags) : [],
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get public content
 */
export function getPublicContent(limit: number = 50, offset: number = 0): Content[] {
  const stmt = db.prepare(`
    SELECT * FROM content 
    WHERE is_public = 1 
    ORDER BY updated_at DESC 
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(limit, offset) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    data: JSON.parse(row.data),
    tags: row.tags ? JSON.parse(row.tags) : [],
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Update content
 */
export function updateContent(
  id: string,
  userId: string,
  updates: Partial<{
    title: string;
    description: string;
    type: 'study_set' | 'notes' | 'reference';
    data: any;
    tags: string[];
    isPublic: boolean;
  }>
): Content | null {
  const content = getContentById(id);
  if (!content || content.userId !== userId) {
    return null;
  }
  
  const now = new Date().toISOString();
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  
  if (updates.title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(updates.title);
  }
  if (updates.description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(updates.description);
  }
  if (updates.type !== undefined) {
    updateFields.push('type = ?');
    updateValues.push(updates.type);
  }
  if (updates.data !== undefined) {
    updateFields.push('data = ?');
    updateValues.push(JSON.stringify(updates.data));
  }
  if (updates.tags !== undefined) {
    updateFields.push('tags = ?');
    updateValues.push(JSON.stringify(updates.tags));
  }
  if (updates.isPublic !== undefined) {
    updateFields.push('is_public = ?');
    updateValues.push(updates.isPublic ? 1 : 0);
  }
  
  updateFields.push('updated_at = ?');
  updateValues.push(now);
  updateValues.push(id);
  
  const stmt = db.prepare(`
    UPDATE content 
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...updateValues);
  
  return getContentById(id);
}

/**
 * Delete content
 */
export function deleteContent(id: string, userId: string): boolean {
  const content = getContentById(id);
  if (!content || content.userId !== userId) {
    return false;
  }
  
  const stmt = db.prepare('DELETE FROM content WHERE id = ?');
  stmt.run(id);
  
  return true;
}

/**
 * Search content by title or tags
 */
export function searchContent(
  userId: string,
  query: string,
  limit: number = 50
): Content[] {
  const stmt = db.prepare(`
    SELECT * FROM content 
    WHERE user_id = ? 
    AND (title LIKE ? OR tags LIKE ?)
    ORDER BY updated_at DESC 
    LIMIT ?
  `);
  const rows = stmt.all(userId, `%${query}%`, `%${query}%`, limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    data: JSON.parse(row.data),
    tags: row.tags ? JSON.parse(row.tags) : [],
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get content by type
 */
export function getContentByType(
  userId: string,
  type: 'study_set' | 'notes' | 'reference'
): Content[] {
  const stmt = db.prepare(`
    SELECT * FROM content 
    WHERE user_id = ? AND type = ? 
    ORDER BY updated_at DESC
  `);
  const rows = stmt.all(userId, type) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    type: row.type,
    data: JSON.parse(row.data),
    tags: row.tags ? JSON.parse(row.tags) : [],
    isPublic: row.is_public === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
