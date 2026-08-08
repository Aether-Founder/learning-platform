import { describe, it, expect, beforeEach } from 'vitest';
import {
  createCalendarEvent,
  getCalendarEventById,
  getCalendarEventsByDateRange,
  getCalendarEventsByUserId,
  updateCalendarEvent,
  deleteCalendarEvent,
  getEventsByTestWeek,
} from '@/lib/calendar-events';
import { createTestUser } from '@/test-utils/auth';
import { resetDatabase } from '@/test-utils/db';

describe('calendar-events', () => {
  let userId: string;

  beforeEach(async () => {
    resetDatabase();
    const user = await createTestUser({ email: 'cal@test.local' });
    userId = user.user.id;
  });

  it('creates an all-day event', () => {
    const event = createCalendarEvent(userId, {
      title: 'Proefwerk',
      description: 'Hoofdstuk 3',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
      color: 'blue',
    });
    expect(event.id).toBeTruthy();
    expect(event.title).toBe('Proefwerk');
    expect(event.allDay).toBe(true);
    expect(event.color).toBe('blue');
  });

  it('gets by id and returns null for missing', () => {
    const event = createCalendarEvent(userId, {
      title: 'E',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
    });
    expect(getCalendarEventById(event.id)?.title).toBe('E');
    expect(getCalendarEventById('ghost')).toBeNull();
  });

  it('filters events by date range', () => {
    createCalendarEvent(userId, {
      title: 'Binnen',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
    });
    createCalendarEvent(userId, {
      title: 'Buiten',
      startDate: '2026-02-15T00:00:00Z',
      endDate: '2026-02-15T23:59:59Z',
      allDay: true,
    });
    const within = getCalendarEventsByDateRange(
      userId,
      '2026-01-01T00:00:00Z',
      '2026-01-31T23:59:59Z'
    );
    expect(within.map((e) => e.title)).toEqual(['Binnen']);
  });

  it('lists all events for a user', () => {
    createCalendarEvent(userId, {
      title: 'A',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
    });
    createCalendarEvent(userId, {
      title: 'B',
      startDate: '2026-02-15T00:00:00Z',
      endDate: '2026-02-15T23:59:59Z',
      allDay: true,
    });
    expect(getCalendarEventsByUserId(userId)).toHaveLength(2);
  });

  it('updates an event', () => {
    const event = createCalendarEvent(userId, {
      title: 'E',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
    });
    const updated = updateCalendarEvent(event.id, {
      title: 'Nieuwe titel',
      reminderMinutes: 30,
    });
    expect(updated?.title).toBe('Nieuwe titel');
    expect(updated?.reminderMinutes).toBe(30);
  });

  it('deletes an event', () => {
    const event = createCalendarEvent(userId, {
      title: 'E',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
    });
    expect(deleteCalendarEvent(event.id)).toBe(true);
    expect(deleteCalendarEvent(event.id)).toBe(false);
  });

  it('finds events by test week', () => {
    createCalendarEvent(userId, {
      title: 'TW Event',
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-15T23:59:59Z',
      allDay: true,
      testWeekId: 'tw-1',
    });
    createCalendarEvent(userId, {
      title: 'Normaal',
      startDate: '2026-01-16T00:00:00Z',
      endDate: '2026-01-16T23:59:59Z',
      allDay: true,
    });
    const events = getEventsByTestWeek('tw-1');
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('TW Event');
  });
});
