import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { generateTokens } from '@/lib/auth';
import {
  authenticateRequest,
  getBearerToken,
  getOptionalUser,
  isAuthFailure,
} from '@/lib/api/auth';

const requestWith = (authorization?: string) =>
  new NextRequest('http://localhost/api/test', {
    headers: authorization ? { authorization } : {},
  });

describe('getBearerToken', () => {
  it('reads the bearer token', () => {
    expect(getBearerToken(requestWith('Bearer abc'))).toBe('abc');
  });

  it('returns null for missing or malformed headers', () => {
    expect(getBearerToken(requestWith())).toBeNull();
    expect(getBearerToken(requestWith('Basic abc'))).toBeNull();
    expect(getBearerToken(requestWith('Bearer '))).toBeNull();
  });
});

describe('authenticateRequest', () => {
  it('returns the token payload for a valid token', () => {
    const { accessToken } = generateTokens('user-1');
    const result = authenticateRequest(requestWith(`Bearer ${accessToken}`));

    expect(isAuthFailure(result)).toBe(false);
    if (isAuthFailure(result)) return;
    expect(result.user.userId).toBe('user-1');
  });

  it('returns a 401 with the route-specific message when the header is missing', async () => {
    const result = authenticateRequest(requestWith(), {
      missingTokenMessage: 'No authorization header',
    });

    expect(isAuthFailure(result)).toBe(true);
    if (!isAuthFailure(result)) return;
    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({ error: 'No authorization header' });
  });

  it('returns a 401 for an invalid token', async () => {
    const result = authenticateRequest(requestWith('Bearer nope'));

    expect(isAuthFailure(result)).toBe(true);
    if (!isAuthFailure(result)) return;
    await expect(result.response.json()).resolves.toEqual({ error: 'Invalid token' });
  });
});

describe('getOptionalUser', () => {
  it('returns null when unauthenticated and the payload otherwise', () => {
    expect(getOptionalUser(requestWith())).toBeNull();
    expect(getOptionalUser(requestWith('Bearer nope'))).toBeNull();

    const { accessToken } = generateTokens('user-2');
    expect(getOptionalUser(requestWith(`Bearer ${accessToken}`))?.userId).toBe('user-2');
  });
});
