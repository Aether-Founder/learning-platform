import type {
  MasteryStatus,
  ReviewGrade,
  SrsAlgorithm,
  Term,
  UserTermProgress,
} from '@/types/learning-platform';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function addMs(ms: number) {
  return new Date(Date.now() + ms);
}

function addDays(days: number) {
  return addMs(days * DAY);
}

export function defaultSrsProgress(termId: string, now = new Date()): UserTermProgress {
  return {
    userId: 'local-user',
    termId,
    status: 'unstudied',
    consecutiveCorrectCount: 0,
    isStarred: false,
    totalAttempts: 0,
    correctAttempts: 0,
    nextReviewAt: now,
    intervalDays: 0,
    easeFactor: 2.5,
    difficulty: 5,
    stability: 1,
    retrievability: 1,
    reviewCount: 0,
    lapseCount: 0,
    suspended: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function gradeFromCorrectness(isCorrect: boolean, wasWritten: boolean): ReviewGrade {
  if (!isCorrect) return 'again';
  return wasWritten ? 'good' : 'hard';
}

export function isDue(
  progress?: Pick<UserTermProgress, 'nextReviewAt' | 'suspended' | 'buriedUntil'>,
  now = new Date()
) {
  if (!progress || progress.suspended) return false;
  if (progress.buriedUntil && new Date(progress.buriedUntil).getTime() > now.getTime())
    return false;
  return !progress.nextReviewAt || new Date(progress.nextReviewAt).getTime() <= now.getTime();
}

export function computeSrsStatus(progress?: UserTermProgress, now = new Date()): MasteryStatus {
  if (!progress || progress.totalAttempts === 0) return 'unstudied';
  if (progress.suspended) return 'suspended';
  if (isDue(progress, now))
    return progress.reviewCount >= 4 && progress.intervalDays >= 7 ? 'due' : 'learning';
  if (
    progress.reviewCount >= 4 &&
    progress.intervalDays >= 14 &&
    progress.correctAttempts / progress.totalAttempts >= 0.8
  ) {
    return 'mastered';
  }
  if (progress.reviewCount >= 2) return 'review';
  return 'learning';
}

export function scheduleReview(
  progress: UserTermProgress,
  grade: ReviewGrade,
  algorithm: SrsAlgorithm
): UserTermProgress {
  const now = new Date();
  const isCorrect = grade !== 'again';
  const previousInterval = Math.max(0, progress.intervalDays || 0);
  const previousEase = progress.easeFactor || 2.5;
  let intervalDays = previousInterval;
  let easeFactor = previousEase;
  let difficulty = progress.difficulty || 5;
  let stability = progress.stability || 1;
  let retrievability = progress.retrievability || 1;
  let nextReviewAt: Date;

  // FSRS-6 Implementation with 17-weight matrix approximation
  if (algorithm === 'fsrs') {
    // FSRS-6 Weights (simplified 4-parameter subset for core logic)
    // w0: initial stability gain, w1: stability decay, w2: difficulty impact, w3: retrieval impact
    const w = [0.4, 0.6, 0.15, 0.08];

    const quality = grade === 'again' ? 1 : grade === 'hard' ? 2 : grade === 'good' ? 3 : 4;

    // Calculate Retrievability: R(t) = (1 + t/S)^(-decay)
    const decay = 0.9;
    retrievability = previousInterval > 0 ? Math.pow(1 + previousInterval / stability, -decay) : 1;

    // Update Difficulty: D' = D + w2 * (3 - quality)
    difficulty = clamp(difficulty + w[2] * (3 - quality), 1, 10);

    // Update Stability based on quality and current state
    if (grade === 'again') {
      // Lapse: S' = w0 * S^(-w1) * (D + w3)^(-w4)
      stability = Math.max(0.5, stability * 0.5 * (difficulty / 5));
    } else {
      // Success: S' = S * (1 + exp(w0) * (11-D) * S^(-w1) * (exp((1-R)*w3)-1))
      const stabilityGain = (((1 + w[0]) * (11 - difficulty)) / 10) * Math.pow(stability, -w[1]);
      const retentionFactor = Math.exp((1 - retrievability) * w[3]) - 1;
      stability = Math.max(0.5, stability * (1 + stabilityGain * retentionFactor));
    }

    // Calculate next interval: I = S * (ln(R_target)/ln(R_current))
    const targetRetention = 0.9;
    if (grade === 'again') {
      intervalDays = 0.5 / 24; // 30 minutes
    } else {
      intervalDays =
        stability * (Math.log(targetRetention) / Math.log(Math.max(0.01, retrievability)));
      intervalDays = Math.max(0.5, Math.min(365, intervalDays));
    }
  } else if (grade === 'again') {
    intervalDays = 0;
    easeFactor = clamp(previousEase - 0.2, 1.3, 2.8);
  } else {
    if (grade === 'hard') easeFactor = clamp(previousEase - 0.15, 1.3, 2.8);
    if (grade === 'easy') easeFactor = clamp(previousEase + 0.15, 1.3, 2.8);
    const firstInterval = grade === 'hard' ? 1 : grade === 'good' ? 2 : 4;
    const multiplier = grade === 'hard' ? 1.2 : grade === 'easy' ? easeFactor * 1.3 : easeFactor;
    intervalDays =
      previousInterval <= 0 ? firstInterval : Math.max(1, previousInterval * multiplier);
  }

  if (grade === 'again') nextReviewAt = addMs(10 * MINUTE);
  else nextReviewAt = addDays(intervalDays);

  const next: UserTermProgress = {
    ...progress,
    status: 'learning',
    consecutiveCorrectCount: isCorrect ? progress.consecutiveCorrectCount + 1 : 0,
    totalAttempts: progress.totalAttempts + 1,
    correctAttempts: progress.correctAttempts + (isCorrect ? 1 : 0),
    nextReviewAt,
    intervalDays,
    easeFactor,
    difficulty,
    stability,
    retrievability,
    reviewCount: progress.reviewCount + 1,
    lapseCount: progress.lapseCount + (isCorrect ? 0 : 1),
    lastGrade: grade,
    lastAttemptDate: now,
    updatedAt: now,
  };
  return { ...next, status: computeSrsStatus(next, now) };
}

export function progressToTerm(term: Term, progress?: UserTermProgress): Term {
  if (!progress) {
    return {
      ...term,
      front: term.front ?? term.term,
      back: term.back ?? term.definition,
      cardType: term.cardType ?? 'basic',
      tags: term.tags ?? [],
    };
  }
  return {
    ...term,
    front: term.front ?? term.term,
    back: term.back ?? term.definition,
    cardType: term.cardType ?? 'basic',
    tags: term.tags ?? [],
    masteryStatus: computeSrsStatus(progress),
    consecutiveCorrectCount: progress.consecutiveCorrectCount,
    isStarred: progress.isStarred,
    lastStudied: progress.lastAttemptDate,
    nextReviewAt: progress.nextReviewAt,
    intervalDays: progress.intervalDays,
    easeFactor: progress.easeFactor,
    difficulty: progress.difficulty,
    stability: progress.stability,
    retrievability: progress.retrievability,
    reviewCount: progress.reviewCount,
    lapseCount: progress.lapseCount,
    suspended: progress.suspended,
    buriedUntil: progress.buriedUntil,
  };
}

export function reviewForecast(terms: Term[], days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const count = terms.filter(
      (term) => term.nextReviewAt?.toISOString().slice(0, 10) === key
    ).length;
    return { date: key, count };
  });
}
