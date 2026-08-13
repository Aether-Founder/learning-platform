import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ApiError,
  fetchJson,
  getErrorMessage,
  readStoredJson,
  writeStoredJson,
} from '@/lib/errors';

function mockFetch(body: string, init: { status?: number } = {}) {
  const response = new Response(body, { status: init.status ?? 200 });
  return vi.fn().mockResolvedValue(response);
}

describe('errors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getErrorMessage', () => {
    it('uses the error message, the string value or the fallback', () => {
      expect(getErrorMessage(new Error('boom'))).toBe('boom');
      expect(getErrorMessage('boom')).toBe('boom');
      expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    });
  });

  describe('fetchJson', () => {
    it('parses successful JSON responses', async () => {
      vi.stubGlobal('fetch', mockFetch(JSON.stringify({ ok: true })));
      await expect(fetchJson<{ ok: boolean }>('/api/test')).resolves.toEqual({ ok: true });
    });

    it('throws ApiError with the server message on non-2xx responses', async () => {
      vi.stubGlobal('fetch', mockFetch(JSON.stringify({ error: 'Nope' }), { status: 403 }));
      await expect(fetchJson('/api/test')).rejects.toMatchObject({
        name: 'ApiError',
        status: 403,
        message: 'Nope',
      });
    });

    it('throws when a successful response is not JSON', async () => {
      vi.stubGlobal('fetch', mockFetch('<html>oops</html>'));
      await expect(fetchJson('/api/test')).rejects.toBeInstanceOf(ApiError);
    });
  });

  describe('localStorage helpers', () => {
    it('round-trips values', () => {
      expect(writeStoredJson('key', { a: 1 })).toBe(true);
      expect(readStoredJson('key', null)).toEqual({ a: 1 });
    });

    it('falls back when the entry is missing or corrupt', () => {
      expect(readStoredJson('missing', 'fallback')).toBe('fallback');
      localStorage.setItem('corrupt', '{not json');
      expect(readStoredJson('corrupt', 'fallback')).toBe('fallback');
    });

    it('reports write failures instead of throwing', () => {
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(writeStoredJson('key', { a: 1 })).toBe(false);
    });
  });
});
