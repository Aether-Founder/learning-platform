import { useEffect, useRef } from 'react';

// Generate a random UUID for anonymous user tracking
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get user data from localStorage (name, email)
function getUserData(): { name?: string; email?: string } {
  if (typeof window === 'undefined') return {};

  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }

  return {};
}

// Get or create anonymous user ID from localStorage
function getUserId(): string {
  if (typeof window === 'undefined') return '';

  const userData = getUserData();
  // Use email as user ID if available, otherwise generate UUID
  if (userData.email) {
    return userData.email;
  }

  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = generateUUID();
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
}

// Get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Analytics event types
export type AnalyticsEventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'flashcard_flip'
  | 'flashcard_answer'
  | 'bookmark_add'
  | 'bookmark_remove'
  | 'mode_switch'
  | 'language_change'
  | 'theme_change';

export interface AnalyticsEvent {
  userId: string;
  userName?: string;
  userEmail?: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  timestamp: number;
  data?: Record<string, any>;
}

// Send event to analytics API
async function trackEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    // Silent fail - don't disrupt user experience
    console.error('Analytics tracking failed:', error);
  }
}

// Analytics hook for components
export function useAnalytics() {
  const userId = useRef<string>('');
  const sessionId = useRef<string>('');
  const sessionStartTime = useRef<number>(0);
  const pageStartTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    userId.current = getUserId();
    sessionId.current = getSessionId();
    sessionStartTime.current = Date.now();
    pageStartTime.current = Date.now();

    const userData = getUserData();

    // Track session start
    trackEvent({
      userId: userId.current,
      userName: userData.name,
      userEmail: userData.email,
      sessionId: sessionId.current,
      eventType: 'session_start',
      timestamp: Date.now(),
      data: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
    });

    // Track page view
    trackEvent({
      userId: userId.current,
      userName: userData.name,
      userEmail: userData.email,
      sessionId: sessionId.current,
      eventType: 'page_view',
      timestamp: Date.now(),
      data: {
        path: window.location.pathname,
        referrer: document.referrer,
      },
    });

    // Track session end on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      trackEvent({
        userId: userId.current,
        userName: userData.name,
        userEmail: userData.email,
        sessionId: sessionId.current,
        eventType: 'session_end',
        timestamp: Date.now(),
        data: {
          duration: sessionDuration,
        },
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Track custom events
  const track = (eventType: AnalyticsEventType, data?: Record<string, any>) => {
    if (typeof window === 'undefined') return;

    const userData = getUserData();

    trackEvent({
      userId: userId.current || getUserId(),
      userName: userData.name,
      userEmail: userData.email,
      sessionId: sessionId.current || getSessionId(),
      eventType,
      timestamp: Date.now(),
      data,
    });
  };

  // Track time spent on current page
  const trackPageTime = () => {
    if (typeof window === 'undefined') return;

    const timeSpent = Date.now() - pageStartTime.current;
    pageStartTime.current = Date.now();

    track('page_view', {
      path: window.location.pathname,
      timeSpent,
    });
  };

  return {
    track,
    trackPageTime,
    userId: userId.current,
    sessionId: sessionId.current,
  };
}

// Export utility functions for direct use
export const analytics = {
  getUserId,
  getSessionId,
  trackEvent,
};
