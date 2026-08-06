/**
 * Supabase Queries for Study Sets
 * 
 * All database operations related to study sets and flashcards
 */

import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type StudySet = Database['public']['Tables']['study_sets']['Row'];
type StudySetInsert = Database['public']['Tables']['study_sets']['Insert'];
type StudySetUpdate = Database['public']['Tables']['study_sets']['Update'];
type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardInsert = Database['public']['Tables']['flashcards']['Insert'];

/**
 * Get all study sets for the current user
 */
export async function getUserStudySets(userId: string) {
  const { data, error } = await supabase
    .from('study_sets')
    .select(`
      *,
      subject:subjects(id, name, slug, color)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return { data, error };
}

/**
 * Get study sets by subject
 */
export async function getStudySetsBySubject(userId: string, subjectId: string) {
  const { data, error } = await supabase
    .from('study_sets')
    .select(`
      *,
      subject:subjects(id, name, slug, color)
    `)
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('updated_at', { ascending: false });

  return { data, error };
}

/**
 * Get a single study set by ID with flashcards
 */
export async function getStudySetById(studySetId: string) {
  const { data, error } = await supabase
    .from('study_sets')
    .select(`
      *,
      subject:subjects(id, name, slug, color),
      flashcards(*)
    `)
    .eq('id', studySetId)
    .single();

  return { data, error };
}

/**
 * Get a single study set by slug
 */
export async function getStudySetBySlug(userId: string, slug: string) {
  const { data, error } = await supabase
    .from('study_sets')
    .select(`
      *,
      subject:subjects(id, name, slug, color),
      flashcards(*)
    `)
    .eq('user_id', userId)
    .eq('slug', slug)
    .single();

  return { data, error };
}

/**
 * Get public study sets (discoverable by all users)
 */
export async function getPublicStudySets(limit: number = 20) {
  const { data, error } = await supabase
    .from('study_sets')
    .select(`
      *,
      subject:subjects(id, name, slug, color)
    `)
    .eq('is_public', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * Create a new study set
 */
export async function createStudySet(studySet: StudySetInsert) {
  const { data, error } = await supabase
    .from('study_sets')
    .insert(studySet)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a study set
 */
export async function updateStudySet(studySetId: string, updates: StudySetUpdate) {
  const { data, error } = await supabase
    .from('study_sets')
    .update(updates)
    .eq('id', studySetId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a study set (cascades to flashcards)
 */
export async function deleteStudySet(studySetId: string) {
  const { error } = await supabase
    .from('study_sets')
    .delete()
    .eq('id', studySetId);

  return { error };
}

/**
 * Increment view count for a study set
 */
export async function incrementStudySetViews(studySetId: string) {
  const { data, error } = await supabase.rpc('increment', {
    table_name: 'study_sets',
    row_id: studySetId,
    column_name: 'view_count',
  });

  return { data, error };
}

// ============================================================================
// FLASHCARD OPERATIONS
// ============================================================================

/**
 * Get all flashcards for a study set
 */
export async function getFlashcardsByStudySet(studySetId: string) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('study_set_id', studySetId)
    .order('order_index');

  return { data, error };
}

/**
 * Create a new flashcard
 */
export async function createFlashcard(flashcard: FlashcardInsert) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcard)
    .select()
    .single();

  return { data, error };
}

/**
 * Create multiple flashcards at once
 */
export async function createFlashcards(flashcards: FlashcardInsert[]) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert(flashcards)
    .select();

  return { data, error };
}

/**
 * Update a flashcard
 */
export async function updateFlashcard(
  flashcardId: string,
  updates: Partial<Flashcard>
) {
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', flashcardId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a flashcard
 */
export async function deleteFlashcard(flashcardId: string) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', flashcardId);

  return { error };
}

/**
 * Reorder flashcards in a study set
 */
export async function reorderFlashcards(
  updates: { id: string; order_index: number }[]
) {
  // Use a transaction-like approach by updating all at once
  const promises = updates.map(({ id, order_index }) =>
    supabase
      .from('flashcards')
      .update({ order_index })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return { error: errors.length > 0 ? errors[0] : null };
}
