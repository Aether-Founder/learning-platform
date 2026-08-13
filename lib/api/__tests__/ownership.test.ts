import { describe, it, expect } from 'vitest';
import { isResourceFailure, loadOwnedResource } from '@/lib/api/ownership';

interface Homework {
  id: string;
  userId: string;
}

const homework: Homework = { id: 'hw-1', userId: 'user-1' };

describe('loadOwnedResource', () => {
  it('returns the resource when the caller owns it', async () => {
    const result = await loadOwnedResource(() => homework, {
      userId: 'user-1',
      notFoundMessage: 'Homework not found',
      ownerId: (resource) => resource.userId,
    });

    expect(isResourceFailure(result)).toBe(false);
    if (isResourceFailure(result)) return;
    expect(result.resource).toBe(homework);
  });

  it('returns a 404 when the resource is missing', async () => {
    const result = await loadOwnedResource<Homework>(() => null, {
      userId: 'user-1',
      notFoundMessage: 'Homework not found',
    });

    expect(isResourceFailure(result)).toBe(true);
    if (!isResourceFailure(result)) return;
    expect(result.response.status).toBe(404);
    await expect(result.response.json()).resolves.toEqual({ error: 'Homework not found' });
  });

  it('returns a 403 when another user owns the resource', async () => {
    const result = await loadOwnedResource(() => Promise.resolve(homework), {
      userId: 'user-2',
      notFoundMessage: 'Homework not found',
      ownerId: (resource) => resource.userId,
      forbiddenMessage: 'Unauthorized',
    });

    expect(isResourceFailure(result)).toBe(true);
    if (!isResourceFailure(result)) return;
    expect(result.response.status).toBe(403);
    await expect(result.response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('skips the ownership check when no owner accessor is given', async () => {
    const result = await loadOwnedResource(() => homework, {
      userId: 'someone-else',
      notFoundMessage: 'Homework not found',
    });

    expect(isResourceFailure(result)).toBe(false);
  });
});
