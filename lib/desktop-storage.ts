/**
 * Desktop Storage Utilities for Tauri
 *
 * Provides offline storage capabilities for study sets, flashcards, and user data
 * using localStorage with Tauri integration for enhanced security
 */

import { invoke } from '@tauri-apps/api/core';

export interface StudySet {
  id: string;
  title: string;
  description: string;
  subject: string;
  cards: Flashcard[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_public: boolean;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  study_set_id: string;
  created_at: string;
  updated_at: string;
}

export interface StudyProgress {
  card_id: string;
  study_set_id: string;
  last_reviewed: string;
  next_review: string;
  ease_factor: number;
  interval: number;
  repetitions: number;
}

/**
 * Check if running in Tauri desktop environment
 */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Save study set to local storage (offline support)
 */
export async function saveStudySetLocally(studySet: StudySet): Promise<void> {
  const localSets = getLocalStudySets();
  localSets[studySet.id] = studySet;
  localStorage.setItem('local_study_sets', JSON.stringify(localSets));
}

/**
 * Load study set from local storage
 */
export async function loadStudySetLocally(id: string): Promise<StudySet | null> {
  const localSets = getLocalStudySets();
  return localSets[id] || null;
}

/**
 * Get all locally stored study sets
 */
export async function getAllLocalStudySets(): Promise<StudySet[]> {
  const localSets = getLocalStudySets();
  return Object.values(localSets);
}

/**
 * Delete study set from local storage
 */
export async function deleteStudySetLocally(id: string): Promise<void> {
  const localSets = getLocalStudySets();
  delete localSets[id];
  localStorage.setItem('local_study_sets', JSON.stringify(localSets));
}

/**
 * Save study progress locally (for spaced repetition algorithm)
 */
export async function saveStudyProgress(progress: StudyProgress[]): Promise<void> {
  localStorage.setItem('study_progress', JSON.stringify(progress));
}

/**
 * Load study progress from local storage
 */
export async function loadStudyProgress(): Promise<StudyProgress[]> {
  const stored = localStorage.getItem('study_progress');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Sync local data with Supabase when online
 */
export async function syncWithSupabase(userId: string): Promise<void> {
  if (!isDesktopApp()) return;

  try {
    const localSets = await getAllLocalStudySets();
    const localProgress = await loadStudyProgress();

    // Here you would implement the sync logic with Supabase
    // For now, this is a placeholder
    console.log('Syncing data for user:', userId);
    console.log('Local study sets:', localSets.length);
    console.log('Study progress entries:', localProgress.length);
  } catch (error) {
    console.error('Failed to sync with Supabase:', error);
  }
}

/**
 * Helper function to get local study sets from localStorage
 */
function getLocalStudySets(): Record<string, StudySet> {
  const stored = localStorage.getItem('local_study_sets');
  return stored ? JSON.parse(stored) : {};
}

/**
 * Clear all local data (for logout or reset)
 */
export async function clearLocalData(): Promise<void> {
  localStorage.removeItem('local_study_sets');
  localStorage.removeItem('study_progress');
}
