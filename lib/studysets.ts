import db from './db';
import { generateId } from './auth';
import { logger } from './logger';

export interface StudySet {
  id: string;
  userId: string;
  title: string;
  description?: string;
  folderId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  cards: StudyCard[];
}

export interface StudyCard {
  id: string;
  studySetId: string;
  term: string;
  definition: string;
  imageUrl?: string;
  front?: string;
  back?: string;
  cardType?: string;
  audioUrl?: string;
  tags?: string[];
  clozeText?: string;
  occlusions?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }>;
  createdAt: string;
}

/**
 * Create a new study set
 */
export function createStudySet(
  userId: string,
  title: string,
  description?: string,
  folderId?: string,
  isPublic: boolean = false
): StudySet {
  const studySetId = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO study_sets (id, user_id, title, description, folder_id, is_public, visibility, subject, terms, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    studySetId,
    userId,
    title,
    description || null,
    folderId || null,
    isPublic ? 1 : 0,
    isPublic ? 'public' : 'private',
    'General',
    '[]',
    now,
    now
  );

  return getStudySetById(studySetId)!;
}

/**
 * Get study set by ID
 */
export function getStudySetById(studySetId: string): StudySet | null {
  const stmt = db.prepare('SELECT * FROM study_sets WHERE id = ?');
  const studySetRow = stmt.get(studySetId) as any;

  if (!studySetRow) return null;

  const cards = getStudyCardsByStudySetId(studySetId);

  return {
    id: studySetRow.id,
    userId: studySetRow.user_id,
    title: studySetRow.title,
    description: studySetRow.description,
    folderId: studySetRow.folder_id,
    isPublic: studySetRow.is_public === 1,
    createdAt: studySetRow.created_at,
    updatedAt: studySetRow.updated_at,
    cards,
  };
}

/**
 * Get all study sets for a user
 */
export function getStudySetsByUserId(userId: string): StudySet[] {
  const stmt = db.prepare('SELECT * FROM study_sets WHERE user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId) as any[];

  return rows.map((row) => {
    const cards = getStudyCardsByStudySetId(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      folderId: row.folder_id,
      isPublic: row.is_public === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cards,
    };
  });
}

/**
 * Get public study sets
 */
export function getPublicStudySets(limit: number = 50, offset: number = 0): StudySet[] {
  const stmt = db.prepare(`
    SELECT * FROM study_sets 
    WHERE is_public = 1 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(limit, offset) as any[];

  return rows.map((row) => {
    const cards = getStudyCardsByStudySetId(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      folderId: row.folder_id,
      isPublic: row.is_public === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cards,
    };
  });
}

/**
 * Update study set
 */
export function updateStudySet(
  studySetId: string,
  updates: Partial<Pick<StudySet, 'title' | 'description' | 'folderId' | 'isPublic'>>
): StudySet | null {
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
  if (updates.folderId !== undefined) {
    fields.push('folder_id = ?');
    values.push(updates.folderId);
  }
  if (updates.isPublic !== undefined) {
    fields.push('is_public = ?');
    values.push(updates.isPublic ? 1 : 0);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(studySetId);

  const stmt = db.prepare(`
    UPDATE study_sets
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
  return getStudySetById(studySetId);
}

/**
 * Delete study set
 */
export function deleteStudySet(studySetId: string): boolean {
  // First delete all cards in the study set
  const deleteCardsStmt = db.prepare('DELETE FROM study_cards WHERE study_set_id = ?');
  deleteCardsStmt.run(studySetId);

  // Then delete the study set
  const stmt = db.prepare('DELETE FROM study_sets WHERE id = ?');
  const result = stmt.run(studySetId);
  return result.changes > 0;
}

/**
 * Add a card to a study set
 */
export function addStudyCard(
  studySetId: string,
  term: string,
  definition: string,
  imageUrl?: string,
  options: Partial<
    Pick<
      StudyCard,
      'front' | 'back' | 'cardType' | 'audioUrl' | 'tags' | 'clozeText' | 'occlusions'
    >
  > = {}
): StudyCard {
  const cardId = generateId();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO study_cards (id, study_set_id, term, definition, front, back, card_type, image_url, audio_url, tags, cloze_text, occlusions, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    cardId,
    studySetId,
    term,
    definition,
    options.front || term,
    options.back || definition,
    options.cardType || 'basic',
    imageUrl || null,
    options.audioUrl || null,
    JSON.stringify(options.tags || []),
    options.clozeText || null,
    JSON.stringify(options.occlusions || []),
    now,
    now
  );

  return {
    id: cardId,
    studySetId,
    term,
    definition,
    front: options.front || term,
    back: options.back || definition,
    cardType: options.cardType || 'basic',
    imageUrl,
    audioUrl: options.audioUrl,
    tags: options.tags || [],
    clozeText: options.clozeText,
    occlusions: options.occlusions || [],
    createdAt: now,
  };
}

/**
 * Get all cards for a study set
 */
export function getStudyCardsByStudySetId(studySetId: string): StudyCard[] {
  const stmt = db.prepare(
    'SELECT * FROM study_cards WHERE study_set_id = ? ORDER BY created_at ASC'
  );
  const rows = stmt.all(studySetId) as any[];
  if (rows.length === 0) {
    const setRow = db.prepare('SELECT terms FROM study_sets WHERE id = ?').get(studySetId) as
      { terms?: string } | undefined;
    try {
      const terms = JSON.parse(setRow?.terms || '[]');
      if (Array.isArray(terms)) {
        return terms
          .filter((term) => (term.term || term.front) && (term.definition || term.back))
          .map((term, index) => ({
            id: term.id || `${studySetId}-legacy-${index}`,
            studySetId,
            term: term.term || term.front,
            definition: term.definition || term.back,
            front: term.front || term.term,
            back: term.back || term.definition,
            imageUrl: term.imageUrl || term.image,
            audioUrl: term.audioUrl || term.audio,
            cardType: term.cardType || term.type || 'basic',
            tags: term.tags || [],
            clozeText: term.clozeText,
            occlusions: term.occlusions || [],
            createdAt: term.createdAt || new Date().toISOString(),
          }));
      }
    } catch (error) {
      logger.error('Failed to parse legacy terms for study set', error, { studySetId });
      return [];
    }
  }

  return rows.map((row) => ({
    id: row.id,
    studySetId: row.study_set_id,
    term: row.term,
    definition: row.definition,
    front: row.front || row.term,
    back: row.back || row.definition,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    cardType: row.card_type || 'basic',
    tags: JSON.parse(row.tags || '[]'),
    clozeText: row.cloze_text,
    occlusions: JSON.parse(row.occlusions || '[]'),
    createdAt: row.created_at,
  }));
}

/**
 * Update a study card
 */
export function updateStudyCard(
  cardId: string,
  updates: Partial<Pick<StudyCard, 'term' | 'definition' | 'imageUrl'>>
): StudyCard | null {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.term !== undefined) {
    fields.push('term = ?');
    values.push(updates.term);
  }
  if (updates.definition !== undefined) {
    fields.push('definition = ?');
    values.push(updates.definition);
  }
  if (updates.imageUrl !== undefined) {
    fields.push('image_url = ?');
    values.push(updates.imageUrl);
  }

  if (fields.length === 0) {
    return getStudyCardById(cardId);
  }

  values.push(cardId);
  const stmt = db.prepare(`
    UPDATE study_cards
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
  return getStudyCardById(cardId);
}

/**
 * Get study card by ID
 */
export function getStudyCardById(cardId: string): StudyCard | null {
  const stmt = db.prepare('SELECT * FROM study_cards WHERE id = ?');
  const row = stmt.get(cardId) as any;

  if (!row) return null;

  return {
    id: row.id,
    studySetId: row.study_set_id,
    term: row.term,
    definition: row.definition,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

/**
 * Delete a study card
 */
export function deleteStudyCard(cardId: string): boolean {
  const stmt = db.prepare('DELETE FROM study_cards WHERE id = ?');
  const result = stmt.run(cardId);
  return result.changes > 0;
}

/**
 * Search study sets by title
 */
export function searchStudySets(query: string, userId?: string): StudySet[] {
  const searchPattern = `%${query}%`;

  let stmt;
  if (userId) {
    stmt = db.prepare(`
      SELECT * FROM study_sets 
      WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
      ORDER BY created_at DESC
    `);
  } else {
    stmt = db.prepare(`
      SELECT * FROM study_sets 
      WHERE is_public = 1 AND (title LIKE ? OR description LIKE ?)
      ORDER BY created_at DESC
    `);
  }

  const rows = userId
    ? (stmt.all(userId, searchPattern, searchPattern) as any[])
    : (stmt.all(searchPattern, searchPattern) as any[]);

  return rows.map((row) => {
    const cards = getStudyCardsByStudySetId(row.id);
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      folderId: row.folder_id,
      isPublic: row.is_public === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cards,
    };
  });
}
