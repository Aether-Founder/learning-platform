import type { StudySettings, Term } from '@/types/learning-platform';

export function fisherYatesShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getPromptAndAnswer(
  term: Term,
  format: StudySettings['questionFormat']
): { prompt: string; answer: string } {
  if (format === 'definition-to-term') {
    return { prompt: term.definition, answer: term.term };
  }
  return { prompt: term.term, answer: term.definition };
}

export function filterPlayableTerms(terms: Term[], settings: StudySettings): Term[] {
  let filtered = [...terms];
  const now = Date.now();

  if (settings.selectedLearningSetIds && settings.selectedLearningSetIds.length > 0) {
    const selected = new Set(settings.selectedLearningSetIds);
    filtered = filtered.filter((t) => t.learningSetId && selected.has(t.learningSetId));
  }

  if (settings.studyStarredOnly) {
    filtered = filtered.filter((t) => t.isStarred);
  }

  if (settings.reviewMode === 'starred') {
    filtered = filtered.filter((t) => t.isStarred);
  } else if (settings.reviewMode === 'due') {
    filtered = filtered.filter(
      (t) => !t.suspended && (!t.nextReviewAt || new Date(t.nextReviewAt).getTime() <= now)
    );
  } else if (settings.reviewMode === 'new') {
    filtered = filtered.filter((t) => (t.reviewCount ?? 0) === 0);
  } else if (settings.reviewMode === 'mistakes') {
    filtered = filtered.filter((t) => (t.lapseCount ?? 0) > 0 || t.masteryStatus === 'learning');
  } else {
    filtered = filtered.filter(
      (t) => !t.suspended && (!t.buriedUntil || new Date(t.buriedUntil).getTime() <= now)
    );
  }

  const newLimit = Math.max(0, settings.dailyNewLimit ?? 20);
  const reviewLimit = Math.max(0, settings.dailyReviewLimit ?? 100);
  const newTerms = filtered.filter((t) => (t.reviewCount ?? 0) === 0).slice(0, newLimit);
  const reviewTerms = filtered.filter((t) => (t.reviewCount ?? 0) > 0).slice(0, reviewLimit);
  filtered = settings.reviewMode === 'new' ? newTerms : [...reviewTerms, ...newTerms];

  if (settings.shuffleTerms) {
    filtered = fisherYatesShuffle(filtered);
  }

  if (settings.roundLength !== 'all' && typeof settings.roundLength === 'number') {
    filtered = filtered.slice(0, settings.roundLength);
  }

  return filtered;
}

export function daysUntilExam(examDate?: Date): number | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Prioritize unmastered when exam is within 3 days */
export function prioritizeTermsForExam(terms: Term[], examDate?: Date): Term[] {
  const days = daysUntilExam(examDate);
  if (days === null || days >= 3) return terms;

  const unmastered = terms.filter((t) => t.masteryStatus !== 'mastered');
  const mastered = terms.filter((t) => t.masteryStatus === 'mastered');
  return [...fisherYatesShuffle(unmastered), ...mastered];
}
