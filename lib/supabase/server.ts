/**
 * Supabase Client for Server-Side Operations
 * 
 * Use this client in:
 * - Server Components
 * - API routes
 * - Server Actions
 * - Middleware
 * 
 * This client handles cookies properly for server-side rendering.
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

/**
 * Create a Supabase client for use in Server Components
 * 
 * @example
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = createServerClient();
 *   const { data: studySets } = await supabase
 *     .from('study_sets')
 *     .select('*');
 * 
 *   return <div>{studySets.map(...)}</div>;
 * }
 * ```
 */
/**
 * Get Supabase configuration with graceful fallback
 */
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return early if env vars are missing (allows build to succeed)
  if (!url || !anonKey) {
    console.warn('⚠️  Supabase environment variables not configured in server client.');
    return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder' };
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL:', url);
    return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder' };
  }

  return { url, anonKey };
}

function createCookieClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createSupabaseServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Middleware refreshes sessions instead.
        }
      },
    },
  });
}

export function createServerClient() {
  return createCookieClient();
}

/**
 * Create a Supabase client for use in Server Actions
 * 
 * @example
 * ```tsx
 * 'use server';
 * 
 * import { createActionClient } from '@/lib/supabase/server';
 * 
 * export async function createStudySet(formData: FormData) {
 *   const supabase = createActionClient();
 *   const { data, error } = await supabase
 *     .from('study_sets')
 *     .insert({...});
 *   
 *   return { data, error };
 * }
 * ```
 */
export function createActionClient() {
  return createCookieClient();
}

/**
 * Create a Supabase client for use in API Route Handlers
 * 
 * @example
 * ```tsx
 * import { createRouteClient } from '@/lib/supabase/server';
 * import { NextResponse } from 'next/server';
 * 
 * export async function GET(request: Request) {
 *   const supabase = createRouteClient();
 *   const { data } = await supabase
 *     .from('study_sets')
 *     .select('*');
 *   
 *   return NextResponse.json(data);
 * }
 * ```
 */
export function createRouteClient() {
  return createCookieClient();
}

/**
 * Get the current authenticated user from server context
 * 
 * @returns User object or null if not authenticated
 */
export async function getUser() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's session from server context
 * 
 * @returns Session object or null if not authenticated
 */
export async function getSession() {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Require authentication in Server Components
 * Redirects to login if not authenticated
 * 
 * @param redirectTo - Optional path to redirect after login
 * @returns User object (guaranteed to exist)
 * 
 * @example
 * ```tsx
 * import { requireAuth } from '@/lib/supabase/server';
 * import { redirect } from 'next/navigation';
 * 
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   // user is guaranteed to exist here
 *   return <div>Welcome {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string) {
  const user = await getUser();
  
  if (!user) {
    const { redirect } = await import('next/navigation');
    const loginPath = redirectTo 
      ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : '/login';
    redirect(loginPath);
  }
  
  return user;
}
