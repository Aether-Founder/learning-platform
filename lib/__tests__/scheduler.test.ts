import { describe, it, expect } from 'vitest';
import { StudyScheduler } from '@/lib/scheduler';

type Plan = Parameters<typeof StudyScheduler.generateSessions>[0];
type Set = Parameters<typeof StudyScheduler.generateSessions>[1][number];
type Session = ReturnType<typeof StudyScheduler.generateSessions>[number];

// A Monday, so weekday/weekend behaviour is predictable.
const MONDAY = new Date('2024-05-06T08:00:00.000Z');

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 'plan-1',
    title: 'Toetsweek',
    goalType: 'daily',
    dailyGoalMinutes: 60,
    preferredTimes: ['Avond'],
    studySetIds: ['set-1'],
    ...overrides,
  };
}

function makeSets(count: number): Set[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `set-${index + 1}`,
    title: `Set ${index + 1}`,
    cardCount: 20,
  }));
}

describe('StudyScheduler', () => {
  describe('generateSessions - daily plans', () => {
    it('schedules weekdays only when no weekend preference is set', () => {
      const sessions = StudyScheduler.generateSessions(makePlan(), makeSets(1), MONDAY);
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.every((session) => ![0, 6].includes(session.scheduledDate.getDay()))).toBe(
        true
      );
    });

    it('includes weekends when a weekend slot is preferred', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ preferredTimes: ['Weekend Ochtend'] }),
        makeSets(1),
        MONDAY
      );
      expect(sessions.some((session) => [0, 6].includes(session.scheduledDate.getDay()))).toBe(true);
    });

    it('creates one session per preferred time slot per day', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ preferredTimes: ['Ochtend', 'Avond'] }),
        makeSets(1),
        MONDAY
      );
      const firstDay = sessions.filter(
        (session) => session.scheduledDate.toDateString() === MONDAY.toDateString()
      );
      expect(firstDay).toHaveLength(2);
      expect(firstDay.map((session) => session.startTime.getHours()).sort((a, b) => a - b)).toEqual(
        [7, 18]
      );
    });

    it('carries the plan metadata onto every session', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ dailyGoalMinutes: 45 }),
        makeSets(1),
        MONDAY
      );
      expect(
        sessions.every(
          (session) =>
            session.studyPlanId === 'plan-1' &&
            session.durationMinutes === 45 &&
            session.status === 'scheduled'
        )
      ).toBe(true);
    });

    it('returns no sessions when there are no study sets', () => {
      expect(StudyScheduler.generateSessions(makePlan(), [], MONDAY)).toEqual([]);
    });

    it('rotates evenly through the available study sets', () => {
      const sessions = StudyScheduler.generateSessions(makePlan(), makeSets(2), MONDAY);
      const counts = new Map<string, number>();
      for (const session of sessions) {
        counts.set(session.studySetId, (counts.get(session.studySetId) ?? 0) + 1);
      }
      const values = [...counts.values()];
      expect(counts.size).toBe(2);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    });

    it('prefers the set that was studied longest ago on a tie', () => {
      const sets: Set[] = [
        { id: 'recent', title: 'Recent', cardCount: 10, lastStudied: new Date('2024-05-05') },
        { id: 'stale', title: 'Stale', cardCount: 10, lastStudied: new Date('2024-01-01') },
      ];
      const sessions = StudyScheduler.generateSessions(makePlan(), sets, MONDAY);
      expect(sessions[0].studySetId).toBe('stale');
    });
  });

  describe('generateSessions - exam plans', () => {
    it('only schedules sessions before the target date', () => {
      const targetDate = new Date('2024-05-16T08:00:00.000Z');
      const sessions = StudyScheduler.generateSessions(
        makePlan({ goalType: 'exam', targetDate }),
        makeSets(2),
        MONDAY
      );
      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.every((session) => session.scheduledDate < targetDate)).toBe(true);
    });

    it('returns nothing when the target date has already passed', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ goalType: 'exam', targetDate: new Date('2024-05-01T08:00:00.000Z') }),
        makeSets(1),
        MONDAY
      );
      expect(sessions).toEqual([]);
    });

    it('caps each exam session at 60 minutes', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({
          goalType: 'exam',
          dailyGoalMinutes: 180,
          preferredTimes: ['Ochtend', 'Middag', 'Avond'],
          targetDate: new Date('2024-05-16T08:00:00.000Z'),
        }),
        makeSets(2),
        MONDAY
      );
      expect(sessions.every((session) => session.durationMinutes === 60)).toBe(true);
    });

    it('limits the number of daily slots to the daily goal', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({
          goalType: 'exam',
          dailyGoalMinutes: 60,
          preferredTimes: ['Ochtend', 'Middag', 'Avond'],
          targetDate: new Date('2024-05-16T08:00:00.000Z'),
        }),
        makeSets(2),
        MONDAY
      );
      const firstDay = sessions.filter(
        (session) => session.scheduledDate.toDateString() === MONDAY.toDateString()
      );
      expect(firstDay).toHaveLength(1);
    });

    it('falls back to custom sessions when an exam plan has no target date', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ goalType: 'exam' }),
        makeSets(1),
        MONDAY
      );
      const days = new Set(sessions.map((session) => session.scheduledDate.toDateString()));
      expect(days.size).toBe(14);
    });
  });

  describe('generateSessions - custom plans', () => {
    it('schedules two weeks ahead including weekends', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ goalType: 'custom' }),
        makeSets(1),
        MONDAY
      );
      expect(sessions).toHaveLength(14);
      expect(sessions.some((session) => [0, 6].includes(session.scheduledDate.getDay()))).toBe(true);
    });

    it('defaults to an evening slot when no times are preferred', () => {
      const sessions = StudyScheduler.generateSessions(
        makePlan({ goalType: 'custom', preferredTimes: [] }),
        makeSets(1),
        MONDAY
      );
      expect(sessions[0].startTime.getHours()).toBe(18);
      expect(sessions[0].endTime.getHours()).toBe(19);
    });

    it('maps the named time slots onto fixed hours', () => {
      const hoursFor = (time: string) =>
        StudyScheduler.generateSessions(
          makePlan({ goalType: 'custom', preferredTimes: [time] }),
          makeSets(1),
          MONDAY
        )[0].startTime.getHours();

      expect(hoursFor('Ochtend')).toBe(7);
      expect(hoursFor('Middag')).toBe(12);
      expect(hoursFor('Avond')).toBe(18);
      expect(hoursFor('Nacht')).toBe(20);
      expect(hoursFor('Onbekend')).toBe(9);
    });
  });

  describe('rescheduleSession', () => {
    it('moves a session and recomputes its end time', () => {
      const [session] = StudyScheduler.generateSessions(makePlan(), makeSets(1), MONDAY);
      const newStart = new Date('2024-05-20T10:00:00.000Z');
      const moved = StudyScheduler.rescheduleSession(session, newStart, newStart);
      expect(moved.startTime).toBe(newStart);
      expect(moved.endTime.getTime() - newStart.getTime()).toBe(session.durationMinutes * 60000);
      expect(moved.id).toBe(session.id);
      expect(session.startTime).not.toBe(newStart);
    });
  });

  describe('adjustSchedule', () => {
    it('marks only the completed sessions', () => {
      const sessions: Session[] = StudyScheduler.generateSessions(
        makePlan(),
        makeSets(1),
        MONDAY
      ).slice(0, 3);
      const adjusted = StudyScheduler.adjustSchedule(sessions, [sessions[1].id]);
      expect(adjusted.map((session) => session.status)).toEqual([
        'scheduled',
        'completed',
        'scheduled',
      ]);
    });

    it('leaves the schedule unchanged when nothing was completed', () => {
      const sessions = StudyScheduler.generateSessions(makePlan(), makeSets(1), MONDAY);
      const adjusted = StudyScheduler.adjustSchedule(sessions, []);
      expect(adjusted.every((session) => session.status === 'scheduled')).toBe(true);
    });
  });
});
