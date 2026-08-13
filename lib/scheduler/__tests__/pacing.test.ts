import { describe, it, expect } from 'vitest';
import { calculateExamPacing } from '@/lib/scheduler/pacing';

const NOW = new Date('2024-05-01T12:00:00.000Z');

describe('calculateExamPacing', () => {
  it('spreads the remaining cards over the days left', () => {
    const forecast = calculateExamPacing(100, 40, '2024-05-11T12:00:00.000Z', NOW);
    expect(forecast.daysRemaining).toBe(10);
    expect(forecast.requiredNewCardsPerDay).toBe(4);
    expect(forecast.completionPercentage).toBe(60);
    expect(forecast.isBehindSchedule).toBe(false);
    expect(forecast.targetDate).toBe('2024-05-11T12:00:00.000Z');
  });

  it('rounds the daily target up so nothing is left over', () => {
    const forecast = calculateExamPacing(100, 10, '2024-05-04T12:00:00.000Z', NOW);
    expect(forecast.requiredNewCardsPerDay).toBe(4);
  });

  it('keeps at least one day remaining for a past or same-day exam', () => {
    expect(calculateExamPacing(10, 5, '2024-04-01T12:00:00.000Z', NOW).daysRemaining).toBe(1);
    expect(calculateExamPacing(10, 5, '2024-05-01T12:00:00.000Z', NOW).daysRemaining).toBe(1);
  });

  it('flags being behind schedule above 25 cards a day', () => {
    expect(calculateExamPacing(300, 260, '2024-05-11T12:00:00.000Z', NOW).isBehindSchedule).toBe(
      true
    );
    expect(calculateExamPacing(300, 250, '2024-05-11T12:00:00.000Z', NOW).isBehindSchedule).toBe(
      false
    );
  });

  it('is never behind schedule once everything is studied', () => {
    const forecast = calculateExamPacing(100, 0, '2024-05-02T12:00:00.000Z', NOW);
    expect(forecast.requiredNewCardsPerDay).toBe(0);
    expect(forecast.isBehindSchedule).toBe(false);
    expect(forecast.completionPercentage).toBe(100);
  });

  it('reports full completion for an empty deck', () => {
    const forecast = calculateExamPacing(0, 0, '2024-05-11T12:00:00.000Z', NOW);
    expect(forecast.completionPercentage).toBe(100);
    expect(forecast.totalCards).toBe(0);
  });
});
