import type { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthFailure, type TokenPayload } from './auth';
import { forbidden, notFound } from './responses';

export interface OwnershipOptions<T> {
  userId: string;
  notFoundMessage: string;
  /** Owner of the loaded resource. Omit to only check existence. */
  ownerId?: (resource: T) => string;
  forbiddenMessage?: string;
}

export type ResourceResult<T> = { resource: T } | { response: NextResponse };

export function isResourceFailure<T>(
  result: ResourceResult<T>
): result is { response: NextResponse } {
  return 'response' in result;
}

/** Loads a resource and enforces 404 / 403 before the handler uses it. */
export async function loadOwnedResource<T>(
  load: () => T | null | undefined | Promise<T | null | undefined>,
  { userId, notFoundMessage, ownerId, forbiddenMessage = 'Forbidden' }: OwnershipOptions<T>
): Promise<ResourceResult<T>> {
  const resource = await load();
  if (!resource) return { response: notFound(notFoundMessage) };

  if (ownerId && ownerId(resource) !== userId) {
    return { response: forbidden(forbiddenMessage) };
  }

  return { resource };
}

/** Authenticates the request and loads a resource the caller must own. */
export async function authenticateAndLoad<T>(
  request: NextRequest,
  load: (user: TokenPayload) => T | null | undefined | Promise<T | null | undefined>,
  options: Omit<OwnershipOptions<T>, 'userId'> & { missingTokenMessage?: string }
): Promise<{ user: TokenPayload; resource: T } | { response: NextResponse }> {
  const auth = authenticateRequest(request, {
    missingTokenMessage: options.missingTokenMessage,
  });
  if (isAuthFailure(auth)) return auth;

  const result = await loadOwnedResource(() => load(auth.user), {
    ...options,
    userId: auth.user.userId,
  });
  if (isResourceFailure(result)) return result;

  return { user: auth.user, resource: result.resource };
}
