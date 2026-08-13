import type { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/supabase/request';
import { errorResponse, unauthorized } from './responses';

type RequestUser = Awaited<ReturnType<typeof getRequestUser>>;
export type SupabaseClient = RequestUser['client'];
export type SupabaseUser = NonNullable<RequestUser['user']>;

export type SupabaseAuthResult =
  { client: SupabaseClient; user: SupabaseUser } | { response: NextResponse };

/** Supabase-authenticated caller, or the 401 response to return. */
export async function requireSupabaseUser(request: NextRequest): Promise<SupabaseAuthResult> {
  const { client, user, error } = await getRequestUser(request);
  if (error || !user) return { response: unauthorized('Not authenticated') };
  return { client, user };
}

/**
 * Maps a thrown error to a 400 when its message matches a validation pattern,
 * and to a logged 500 otherwise.
 */
export function validationAwareError(
  error: unknown,
  {
    fallbackMessage,
    validationPattern,
    logMessage,
  }: {
    fallbackMessage: string;
    validationPattern: RegExp;
    logMessage: string;
  }
) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = validationPattern.test(message) ? 400 : 500;
  if (status === 500) console.error(logMessage, error);
  return errorResponse(message, status);
}
