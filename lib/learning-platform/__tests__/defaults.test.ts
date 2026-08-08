import { describe, it, expect } from 'vitest';
import { defaultStudySettings } from '@/lib/learning-platform/defaults';

describe('defaults', () => {
  it('exports a complete StudySettings object', () => {
    expect(defaultStudySettings.roundLength).toBe(20);
    expect(defaultStudySettings.smartGrading).toBe(true);
    expect(defaultStudySettings.srsAlgorithm).toBe('sm2');
    expect(defaultStudySettings.reviewMode).toBe('mix');
    expect(defaultStudySettings.enabledQuestionTypes).toEqual([
      'multiple-choice',
      'written',
      'true-false',
    ]);
    expect(defaultStudySettings.testQuestionDistribution).toEqual({
      'true-false': 25,
      'multiple-choice': 50,
      written: 25,
    });
  });
});
