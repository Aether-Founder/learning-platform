import { describe, it, expect, beforeEach } from 'vitest';
import { getHighScore, saveHighScore } from '@/lib/learning-platform/game-scores';

describe('game-scores', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for unknown scores', () => {
    expect(getHighScore('set-1', 'match')).toBeNull();
  });

  it('saves a score and retrieves it', () => {
    expect(saveHighScore('set-1', 'blast', 42)).toBe(true);
    expect(getHighScore('set-1', 'blast')).toBe(42);
  });

  it('only keeps higher scores by default', () => {
    saveHighScore('set-1', 'blocks', 10);
    expect(saveHighScore('set-1', 'blocks', 5)).toBe(false);
    expect(getHighScore('set-1', 'blocks')).toBe(10);
    expect(saveHighScore('set-1', 'blocks', 20)).toBe(true);
    expect(getHighScore('set-1', 'blocks')).toBe(20);
  });

  it('keeps lower scores when lowerIsBetter', () => {
    saveHighScore('set-1', 'match', 30, true);
    expect(saveHighScore('set-1', 'match', 25, true)).toBe(true);
    expect(getHighScore('set-1', 'match')).toBe(25);
    expect(saveHighScore('set-1', 'match', 40, true)).toBe(false);
    expect(getHighScore('set-1', 'match')).toBe(25);
  });

  it('keeps scores per study set and game independently', () => {
    saveHighScore('set-1', 'sprint', 1);
    saveHighScore('set-2', 'sprint', 2);
    saveHighScore('set-1', 'blocks', 3);
    expect(getHighScore('set-1', 'sprint')).toBe(1);
    expect(getHighScore('set-2', 'sprint')).toBe(2);
    expect(getHighScore('set-1', 'blocks')).toBe(3);
  });
});
