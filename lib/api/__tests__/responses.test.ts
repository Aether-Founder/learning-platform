import { describe, it, expect, vi } from 'vitest';
import {
  badRequest,
  errorResponse,
  forbidden,
  notFound,
  serverError,
  unauthorized,
} from '@/lib/api/responses';

const readBody = async (response: Response) => (await response.json()) as { error: string };

describe('api responses', () => {
  it('builds an error body with the given status', async () => {
    const response = errorResponse('boom', 418);
    expect(response.status).toBe(418);
    expect(await readBody(response)).toEqual({ error: 'boom' });
  });

  it('uses default messages for common statuses', async () => {
    expect(unauthorized().status).toBe(401);
    expect(await readBody(unauthorized())).toEqual({ error: 'Unauthorized' });
    expect(forbidden().status).toBe(403);
    expect(await readBody(forbidden())).toEqual({ error: 'Forbidden' });
    expect(notFound().status).toBe(404);
    expect(await readBody(notFound())).toEqual({ error: 'Not found' });
  });

  it('allows overriding messages', async () => {
    expect(await readBody(unauthorized('No authorization header'))).toEqual({
      error: 'No authorization header',
    });
    expect(badRequest('Name is required').status).toBe(400);
  });

  it('logs and returns a 500 for server errors', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const cause = new Error('db down');

    const response = serverError('Error fetching classes:', cause, 'Failed to fetch classes');

    expect(response.status).toBe(500);
    expect(await readBody(response)).toEqual({ error: 'Failed to fetch classes' });
    expect(spy).toHaveBeenCalledWith('Error fetching classes:', cause);
    spy.mockRestore();
  });
});
