/**
 * Authentication Utilities for Supabase
 * 
 * Helper functions for common authentication operations
 */

import { supabase } from './client';
import type { Database } from '@/types/database.types';

type User = Database['public']['Tables']['users']['Row'];

/**
 * Sign up a new user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password (min 6 characters)
 * @param username - Unique username
 * @param fullName - User's full name (optional)
 * @returns User data or error
 */
export async function signUp({
  email,
  password,
  username,
  fullName,
}: {
  email: string;
  password: string;
  username: string;
  fullName?: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName || email.split('@')[0],
      },
    },
  });

  return { data, error };
}

/**
 * Sign in an existing user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Session data or error
 */
export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send a password reset email
 * 
 * @param email - User's email address
 * @returns Success or error
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/confirm`,
  });

  return { data, error };
}

/**
 * Update user password (must be authenticated)
 * 
 * @param newPassword - New password
 * @returns Success or error
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Get the current authenticated user
 * 
 * @returns User object or null
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's profile from the users table
 * 
 * @returns User profile or null
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update the current user's profile
 * 
 * @param updates - Fields to update
 * @returns Updated profile or error
 */
export async function updateUserProfile(
  updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
) {
  const user = await getCurrentUser();
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

/**
 * Check if a username is available
 * 
 * @param username - Username to check
 * @returns True if available, false if taken
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  // If error and it's "not found", username is available
  if (error && error.code === 'PGRST116') {
    return true;
  }

  // If we found data, username is taken
  return !data;
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 * 
 * @param provider - OAuth provider name
 * @returns Redirect URL or error
 */
export async function signInWithProvider(
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket'
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
}

/**
 * Listen to auth state changes
 * 
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
}
