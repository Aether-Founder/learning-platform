import { describe, it, expect } from 'vitest';
import { GRADEBOOK, OVERALL_AVERAGE, averageOf, type Grade } from '@/lib/os-data';

function grade(overrides: Partial<Grade> = {}): Grade {
  return {
    id: 'g1',
    name: 'SO',
    type: 'SO',
    date: '2026-09-01',
    weight: 1,
    grade: 7,
    period: 1,
    ...overrides,
  };
}

describe('os-data', () => {
  describe('averageOf', () => {
    it('returns null without scored grades', () => {
      expect(averageOf([])).toBeNull();
      expect(averageOf([grade({ grade: null })])).toBeNull();
    });

    it('weighs grades by their weight', () => {
      const average = averageOf([
        grade({ id: 'a', grade: 6, weight: 1 }),
        grade({ id: 'b', grade: 8, weight: 3 }),
      ]);
      expect(average).toBeCloseTo(7.5, 5);
    });

    it('ignores unscored grades', () => {
      const average = averageOf([
        grade({ id: 'a', grade: 6, weight: 1 }),
        grade({ id: 'b', grade: null, weight: 10 }),
      ]);
      expect(average).toBe(6);
    });
  });

  describe('GRADEBOOK', () => {
    it('has unique slugs and a computable average per subject', () => {
      const slugs = GRADEBOOK.map((subject) => subject.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      expect(GRADEBOOK.every((subject) => averageOf(subject.grades) !== null)).toBe(true);
    });
  });

  describe('OVERALL_AVERAGE', () => {
    it('averages the subject averages', () => {
      const values = GRADEBOOK.map((subject) => averageOf(subject.grades) as number);
      const expected = values.reduce((total, value) => total + value, 0) / values.length;
      expect(OVERALL_AVERAGE).toBeCloseTo(expected, 10);
    });
  });
});
