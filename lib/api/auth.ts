import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { unauthorized } from './responses';

export interface TokenPayload {
  userId: string;
}

export type AuthResult = { user: TokenPayload } | { response: NextResponse };

export function isAuthFailure(result: AuthResult): result is { response: NextResponse } {
  return 'response' in result;
}

/** Reads the `Authorization: Bearer <token>` header, or null when absent/malformed. */
export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length) || null;
}

/** Verified token payload for requests where authentication is optional. */
export function getOptionalUser(request: NextRequest): TokenPayload | null {
  const token = getBearerToken(request);
  return token ? verifyToken(token) : null;
}

/**
 * Verifies the bearer token, returning either the payload or the 401 response
 * to send back. `missingTokenMessage` keeps per-route wording intact.
 */
export function authenticateRequest(
  request: NextRequest,
  { missingTokenMessage = 'Unauthorized' }: { missingTokenMessage?: string } = {}
): AuthResult {
  const token = getBearerToken(request);
  if (!token) return { response: unauthorized(missingTokenMessage) };

  const user = verifyToken(token);
  if (!user) return { response: unauthorized('Invalid token') };

  return { user };
}
