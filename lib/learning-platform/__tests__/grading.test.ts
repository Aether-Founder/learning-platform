import { describe, it, expect } from 'vitest';
import {
  normalizeForGrading,
  levenshteinDistance,
  evaluateAnswer,
} from '@/lib/learning-platform/grading';

describe('grading', () => {
  describe('normalizeForGrading', () => {
    it('trims and collapses whitespace', () => {
      expect(normalizeForGrading('  hello   world  ')).toBe('hello world');
    });
    it('strips accents by default', () => {
      expect(normalizeForGrading('café')).toBe('cafe');
    });
    it('lowercases by default', () => {
      expect(normalizeForGrading('HELLO')).toBe('hello');
    });
    it('strips punctuation by default', () => {
      expect(normalizeForGrading('Hello, world!')).toBe('hello world');
    });
    it('respects option overrides', () => {
      expect(normalizeForGrading('Café', { ignoreAccents: false })).toBe('café');
      expect(normalizeForGrading('Hello', { ignoreCase: false })).toBe('Hello');
      expect(normalizeForGrading('a,b', { ignorePunctuation: false })).toBe('a,b');
    });
  });

  describe('levenshteinDistance', () => {
    it('returns 0 for identical normalized strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });
    it('computes distance for one-character difference', () => {
      expect(levenshteinDistance('kitten', 'kittens')).toBe(1);
    });
    it('is case and accent insensitive', () => {
      expect(levenshteinDistance('Café', 'cafe')).toBe(0);
    });
  });

  describe('evaluateAnswer', () => {
    it('marks exact match correct without typo', () => {
      const result = evaluateAnswer('Hello', 'hello', true);
      expect(result).toEqual({ isCorrect: true, isTypo: false, distance: 0 });
    });
    it('marks empty input incorrect', () => {
      const result = evaluateAnswer('   ', 'hello', true);
      expect(result.isCorrect).toBe(false);
      expect(result.distance).toBe(Infinity);
    });
    it('marks small typo correct with smart grading', () => {
      const result = evaluateAnswer('hllo', 'hello', true);
      expect(result.isCorrect).toBe(true);
      expect(result.isTypo).toBe(true);
    });
    it('marks typo incorrect without smart grading', () => {
      const result = evaluateAnswer('hllo', 'hello', false);
      expect(result.isCorrect).toBe(false);
      expect(result.isTypo).toBe(false);
    });
    it('marks large difference incorrect with smart grading', () => {
      const result = evaluateAnswer('completely different', 'hello', true);
      expect(result.isCorrect).toBe(false);
      expect(result.isTypo).toBe(false);
    });
    it('respects custom typo tolerance', () => {
      const result = evaluateAnswer('hllo', 'hello', true, { typoTolerance: 0 });
      expect(result.isCorrect).toBe(false);
    });
  });
});
