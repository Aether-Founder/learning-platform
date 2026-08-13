/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Based on the open-source FSRS algorithm for optimal spaced repetition
 * 
 * Reference: https://github.com/open-spaced-repetition/fsrs
 */

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export interface CardState {
  stability: number;      // How stable the memory is (in days)
  difficulty: number;     // How difficult the card is (1-10)
  retrievability: number; // Probability of recall (0-1)
  due: Date;             // When the card is next due
  interval: number;       // Current interval in days
  lapses: number;         // Number of times card was failed
  last_review?: Date;    // Last review date
}

export interface FSRSParams {
  request_retention: number; // Desired retention rate (0.7-0.99)
  maximum_interval: number; // Maximum interval in days (default 36500 = 100 years)
  enable_fuzz: boolean;      // Add randomness to intervals
}

const DEFAULT_PARAMS: FSRSParams = {
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: true,
};

/**
 * Initialize a new card state
 */
export function initializeCard(): CardState {
  return {
    stability: 0,
    difficulty: 5,
    retrievability: 0,
    due: new Date(),
    interval: 0,
    lapses: 0,
  };
}

/**
 * Calculate next interval based on FSRS algorithm
 * Simplified implementation of FSRS-4/5/6
 */
export function calculateNextInterval(
  state: CardState,
  grade: ReviewGrade,
  params: FSRSParams = DEFAULT_PARAMS
): CardState {
  const now = new Date();
  const daysSinceLastReview = state.last_review
    ? (now.getTime() - state.last_review.getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  let newStability = state.stability;
  let newDifficulty = state.difficulty;
  let newInterval = state.interval;
  let newLapses = state.lapses;

  // Adjust difficulty based on grade
  const difficultyAdjustment = {
    again: 1.5,
    hard: 0.5,
    good: 0,
    easy: -0.5,
  };

  newDifficulty = Math.max(1, Math.min(10, state.difficulty + difficultyAdjustment[grade]));

  // Adjust stability based on grade and current state
  if (grade === 'again') {
    // Failed - reset stability and increase lapses
    newStability = 0;
    newInterval = 0;
    newLapses += 1;
  } else {
    // Passed - calculate new stability
    if (state.stability === 0) {
      // First successful review
      newStability = getInitialStability(grade);
    } else {
      // Subsequent reviews
      newStability = calculateStability(state.stability, daysSinceLastReview, grade);
    }

    // Calculate new interval
    newInterval = calculateInterval(newStability, newDifficulty, params);
  }

  // Apply fuzz if enabled
  if (params.enable_fuzz && newInterval > 1) {
    newInterval = applyFuzz(newInterval);
  }

  // Cap at maximum interval
  newInterval = Math.min(newInterval, params.maximum_interval);

  // Calculate retrievability
  const newRetrievability = calculateRetrievability(newStability, newInterval);

  // Calculate due date
  const due = new Date();
  due.setDate(due.getDate() + Math.round(newInterval));

  return {
    stability: newStability,
    difficulty: newDifficulty,
    retrievability: newRetrievability,
    due,
    interval: newInterval,
    lapses: newLapses,
    last_review: now,
  };
}

/**
 * Get initial stability for first successful review
 */
function getInitialStability(grade: ReviewGrade): number {
  const baseStability = {
    again: 0,
    hard: 0.5,
    good: 1,
    easy: 2,
  };
  return baseStability[grade];
}

/**
 * Calculate stability based on previous stability and time
 */
function calculateStability(
  previousStability: number,
  daysSinceLastReview: number,
  grade: ReviewGrade
): number {
  // Simplified FSRS stability calculation
  const retrievalSuccessRate = Math.exp(-daysSinceLastReview / previousStability);
  
  const stabilityGrowth = {
    again: 0,
    hard: 1.2,
    good: 2.0,
    easy: 3.0,
  };

  if (retrievalSuccessRate < 0.5) {
    // Poor recall - reduce stability
    return previousStability * 0.8;
  }

  // Good recall - increase stability based on grade
  return previousStability * stabilityGrowth[grade];
}

/**
 * Calculate interval based on stability and difficulty
 */
function calculateInterval(
  stability: number,
  difficulty: number,
  params: FSRSParams
): number {
  // Higher difficulty = shorter intervals
  const difficultyModifier = 1 - (difficulty - 5) * 0.1;
  
  // Calculate interval to achieve desired retention
  const interval = stability * difficultyModifier * Math.log(params.request_retention);
  
  return Math.max(1, interval);
}

/**
 * Calculate retrievability (probability of recall)
 */
function calculateRetrievability(stability: number, interval: number): number {
  return Math.exp(-interval / stability);
}

/**
 * Apply randomness to interval (fuzz)
 */
function applyFuzz(interval: number): number {
  const fuzzFactor = 0.15; // 15% variance
  const variance = interval * fuzzFactor;
  const randomVariance = (Math.random() - 0.5) * 2 * variance;
  return Math.max(1, interval + randomVariance);
}

/**
 * Get cards due for review today
 */
export function getDueCards(cards: CardState[]): CardState[] {
  const now = new Date();
  return cards.filter((card) => card.due <= now);
}

/**
 * Get cards due within next N days
 */
export function getCardsDueInDays(cards: CardState[], days: number): CardState[] {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);
  return cards.filter((card) => card.due >= now && card.due <= future);
}

/**
 * Calculate estimated retention rate
 */
export function calculateEstimatedRetention(cards: CardState[]): number {
  if (cards.length === 0) return 0;
  
  const totalRetrievability = cards.reduce((sum, card) => sum + card.retrievability, 0);
  return totalRetrievability / cards.length;
}
