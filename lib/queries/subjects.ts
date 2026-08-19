/**
 * Supabase Queries for Subjects
 *
 * All database operations related to school subjects
 */

import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type SubjectInsert = Database['public']['Tables']['subjects']['Insert'];
type SubjectUpdate = Database['public']['Tables']['subjects']['Update'];

/**
 * Get all subjects for the current user
 */
export async function get_user_subjects(userId: string) {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  return { data, error };
}

/**
 * Get a single subject by slug
 */
export async function get_subject_by_slug(userId: string, slug: string) {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', slug)
    .single();

  return { data, error };
}

/**
 * Get a single subject by ID
 */
export async function get_subject_by_id(subjectId: string) {
  const { data, error } = await supabase.from('subjects').select('*').eq('id', subjectId).single();

  return { data, error };
}

/**
 * Create a new subject
 */
export async function create_subject(subject: SubjectInsert) {
  const { data, error } = await supabase.from('subjects').insert(subject).select().single();

  return { data, error };
}

/**
 * Update a subject
 */
export async function update_subject(subjectId: string, updates: SubjectUpdate) {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', subjectId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a subject
 */
export async function delete_subject(subjectId: string) {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);

  return { error };
}

/**
 * Update subject mastery percentage
 */
export async function update_subject_mastery(subjectId: string, mastery: number) {
  const { data, error } = await supabase
    .from('subjects')
    .update({ mastery })
    .eq('id', subjectId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get subject with analytics
 */
export async function get_subject_with_analytics(subjectId: string) {
  const { data, error } = await supabase
    .from('subject_analytics')
    .select('*')
    .eq('subject_id', subjectId)
    .single();

  return { data, error };
}

/**
 * Get all subjects with analytics for a user
 */
export async function get_user_subjects_with_analytics(userId: string) {
  const { data, error } = await supabase
    .from('subject_analytics')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  return { data, error };
}
