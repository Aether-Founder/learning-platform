/**
 * Supabase authentication helper for API route handlers.
 *
 * It accepts either the browser's Supabase session cookie or an explicit
 * `Authorization: Bearer <access token>` header. Keeping both paths lets
 * existing API consumers migrate without introducing a second auth system.
 */
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import { createRouteClient } from '@/lib/supabase/server';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return { url, anonKey };
}

export async function getRequestUser(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null;

  const client = accessToken
    ? createClient<Database>(getSupabaseConfig().url, getSupabaseConfig().anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      })
    : createRouteClient();

  const { data: { user }, error } = accessToken
    ? await client.auth.getUser(accessToken)
    : await client.auth.getUser();

  return { client, user, error };
}
