/**
 * Supabase Client for Browser/Client-Side Operations
 *
 * Use this client in:
 * - React components
 * - Client-side hooks
 * - Browser-side data fetching
 *
 * This client uses the ANON key which is safe to expose in the browser.
 * Row Level Security (RLS) ensures users can only access their own data.
 */

import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

/**
 * Cookie storage implementation for the browser client
 * This allows the browser client to read and write cookies, syncing with the middleware.
 */
const browserCookieStorage = {
  getAll(): { name: string; value: string }[] {
    if (typeof window === 'undefined') return [];
    return document.cookie
      .split(';')
      .map(c => c.trim())
      .filter(c => c.length > 0)
      .map(c => {
        const [name, ...valueParts] = c.split('=');
        // The value might be empty or contain '=' if it's a JWT, so we join back
        const value = valueParts.join('=');
        return { name, value };
      });
  },
  setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
    if (typeof window === 'undefined') return;
    cookiesToSet.forEach(({ name, value, options }) => {
      let cookieString = `${name}=${encodeURIComponent(value)}`;
      if (options?.maxAge !== undefined) cookieString += `; Max-Age=${options.maxAge}`;
      if (options?.expires instanceof Date) cookieString += `; Expires=${options.expires.toUTCString()}`;
      if (options?.path) cookieString += `; Path=${options.path}`;
      if (options?.domain) cookieString += `; Domain=${options.domain}`;
      if (options?.secure) cookieString += `; Secure`;
      if (options?.sameSite) cookieString += `; SameSite=${options.sameSite}`;
      document.cookie = cookieString;
    });
  }
};

function getBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}

/**
 * Create a fresh Supabase client instance
 * Useful when you need a new instance (e.g., after auth state changes)
 */
export function createClient() {
  const { url, anonKey } = getBrowserConfig();
  return createBrowserClient<Database>(url, anonKey, {
    cookies: browserCookieStorage,
  });
}

let cachedClient: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (!cachedClient) {
    cachedClient = createClient();
  }
  return cachedClient;
}

/**
 * Lazily-initialised Supabase client for use in Client Components.
 *
 * The client is only created on first access so that importing this module
 * never throws — this keeps server-side prerendering and the build working
 * even when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not
 * configured (e.g. during CI or on a fresh clone). Accessing any property
 * without env vars configured throws a descriptive error at runtime.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
  set(_target, prop, value, receiver) {
    Reflect.set(getClient(), prop, value, receiver);
    return true;
  },
});