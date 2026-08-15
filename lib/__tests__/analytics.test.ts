import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analytics, type AnalyticsEvent } from '@/lib/analytics';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

function makeEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
  return {
    userId: 'user-1',
    sessionId: 'session-1',
    eventType: 'page_view',
    timestamp: 1700000000000,
    ...overrides,
  };
}

describe('analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('sessionStorage', createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getUserId', () => {
    it('generates and persists an anonymous id', () => {
      const userId = analytics.getUserId();
      expect(userId).toMatch(UUID_PATTERN);
      expect(localStorage.getItem('analytics_user_id')).toBe(userId);
      expect(analytics.getUserId()).toBe(userId);
    });

    it('prefers the stored user email', () => {
      localStorage.setItem('user_data', JSON.stringify({ email: 'student@example.com' }));
      expect(analytics.getUserId()).toBe('student@example.com');
      expect(localStorage.getItem('analytics_user_id')).toBeNull();
    });

    it('falls back to an anonymous id when user data is corrupt', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('user_data', '{not json');
      expect(analytics.getUserId()).toMatch(UUID_PATTERN);
    });
  });

  describe('getSessionId', () => {
    it('generates and reuses a session id', () => {
      const sessionId = analytics.getSessionId();
      expect(sessionId).toMatch(UUID_PATTERN);
      expect(analytics.getSessionId()).toBe(sessionId);
    });
  });

  describe('trackEvent', () => {
    it('posts the event to the tracking endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);

      const event = makeEvent({ data: { path: '/dashboard' } });
      await analytics.trackEvent(event);

      expect(fetchMock).toHaveBeenCalledWith('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    });

    it('swallows network failures', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new Error('offline'))
      );

      await expect(analytics.trackEvent(makeEvent())).resolves.toBeUndefined();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
