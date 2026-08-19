/**
 * Desktop Authentication Utilities for Tauri
 * 
 * Integrates Supabase authentication with Tauri's secure storage
 * for desktop app session management
 */

import { invoke } from '@tauri-apps/api/core';
import { supabase } from './supabase/client';

interface AuthSession {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

/**
 * Check if running in Tauri desktop environment
 */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Store session securely in Tauri desktop app
 */
export async function storeSession(session: AuthSession): Promise<void> {
  if (!isDesktopApp()) {
    // Fallback to localStorage for web
    localStorage.setItem('auth_session', JSON.stringify(session));
    return;
  }
  
  try {
    await invoke('auth_store_session', { session: JSON.stringify(session) });
  } catch (error) {
    console.error('Failed to store session in Tauri:', error);
    // Fallback to localStorage
    localStorage.setItem('auth_session', JSON.stringify(session));
  }
}

/**
 * Retrieve session from Tauri desktop app
 */
export async function getSession(): Promise<AuthSession | null> {
  if (!isDesktopApp()) {
    // Fallback to localStorage for web
    const stored = localStorage.getItem('auth_session');
    return stored ? JSON.parse(stored) : null;
  }
  
  try {
    const session = await invoke<string>('auth_get_session');
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Failed to get session from Tauri:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem('auth_session');
    return stored ? JSON.parse(stored) : null;
  }
}

/**
 * Clear session from Tauri desktop app
 */
export async function clearSession(): Promise<void> {
  if (!isDesktopApp()) {
    // Fallback to localStorage for web
    localStorage.removeItem('auth_session');
    return;
  }
  
  try {
    await invoke('auth_clear_session');
  } catch (error) {
    console.error('Failed to clear session from Tauri:', error);
    // Fallback to localStorage
    localStorage.removeItem('auth_session');
  }
}

/**
 * Sign in with email and password (desktop-enhanced)
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { data: null, error };

  // Store session in desktop secure storage
  if (data.session && isDesktopApp()) {
    await storeSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user_id: data.user.id,
    });
  }

  return { data, error: null };
}

/**
 * Sign up with email and password (desktop-enhanced)
 */
export async function signUp(email: string, password: string, username: string, fullName?: string) {
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

  if (error) return { data: null, error };

  // Store session in desktop secure storage if email confirmation is not required
  if (data.session && data.user && isDesktopApp()) {
    await storeSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user_id: data.user.id,
    });
  }

  return { data, error: null };
}

/**
 * Sign out (desktop-enhanced)
 */
export async function signOut() {
  await supabase.auth.signOut();
  
  if (isDesktopApp()) {
    await clearSession();
  }
}

/**
 * Initialize desktop auth - restore session on app startup
 */
export async function initializeDesktopAuth() {
  if (!isDesktopApp()) return;

  const session = await getSession();
  if (session) {
    try {
      // Restore session with Supabase
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch (error) {
      console.error('Failed to restore session:', error);
      await clearSession();
    }
  }
}
