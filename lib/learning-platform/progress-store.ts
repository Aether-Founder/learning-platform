import type {
  LearningMode,
  MasteryStatus,
  StudySession,
  StudySettings,
  Term,
  UserTermProgress,
} from '@/types/learning-platform';
import { readStoredJson, writeStoredJson } from '../errors';
import { logger } from '../logger';
import {
  computeSrsStatus,
  defaultSrsProgress,
  gradeFromCorrectness,
  progressToTerm,
  scheduleReview,
} from './srs';

const PROGRESS_KEY = 'learning-platform-progress-v1';
const SESSIONS_KEY = 'learning-platform-sessions-v1';
const SETTINGS_KEY = 'learning-platform-settings-v1';

const DEFAULT_USER_ID = 'local-user';

export function computeMasteryStatus(progress?: UserTermProgress): MasteryStatus {
  return computeSrsStatus(progress);
}

export function applyTermProgress(
  progress: UserTermProgress | undefined,
  termId: string,
  isCorrect: boolean,
  wasWritten = false,
  algorithm: 'sm2' | 'fsrs' = 'sm2',
  grade = gradeFromCorrectness(isCorrect, wasWritten)
): UserTermProgress {
  const now = new Date();
  const base: UserTermProgress = {
    ...defaultSrsProgress(termId, now),
    ...progress,
    nextReviewAt: progress?.nextReviewAt ? new Date(progress.nextReviewAt) : progress?.nextReviewAt,
    buriedUntil: progress?.buriedUntil ? new Date(progress.buriedUntil) : undefined,
    lastAttemptDate: progress?.lastAttemptDate ? new Date(progress.lastAttemptDate) : undefined,
  };
  return scheduleReview(base, grade, algorithm);
}

export function mergeTermsWithProgress(
  terms: Term[],
  progressMap: Record<string, UserTermProgress>
): Term[] {
  return terms.map((term) => {
    const p = progressMap[term.id];
    return progressToTerm(term, p);
  });
}

function reviveProgress(raw: UserTermProgress): UserTermProgress {
  const progress = { ...defaultSrsProgress(raw.termId), ...raw };
  return {
    ...progress,
    nextReviewAt: raw.nextReviewAt ? new Date(raw.nextReviewAt) : progress.nextReviewAt,
    buriedUntil: raw.buriedUntil ? new Date(raw.buriedUntil) : undefined,
    lastAttemptDate: raw.lastAttemptDate ? new Date(raw.lastAttemptDate) : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    status: computeSrsStatus(progress),
  };
}

export interface ProgressStore {
  progress: Record<string, UserTermProgress>;
  sessions: StudySession[];
}

export function loadProgressStore(studySetId: string): ProgressStore {
  if (typeof window === 'undefined') {
    return { progress: {}, sessions: [] };
  }
  const allProgress = readStoredJson<Record<string, Record<string, UserTermProgress>>>(
    PROGRESS_KEY,
    {}
  );
  const allSessions = readStoredJson<Record<string, StudySession[]>>(SESSIONS_KEY, {});
  try {
    const progress = Object.fromEntries(
      Object.entries(allProgress[studySetId] || {}).map(([termId, raw]) => [
        termId,
        reviveProgress(raw as UserTermProgress),
      ])
    );
    const sessions = (allSessions[studySetId] || []).map((s) => ({
      ...s,
      startTime: new Date(s.startTime),
      endTime: s.endTime ? new Date(s.endTime) : undefined,
    }));
    return { progress, sessions };
  } catch (error) {
    logger.error('Failed to revive stored progress, resetting study set state', error, {
      studySetId,
    });
    return { progress: {}, sessions: [] };
  }
}

export function saveProgressForSet(
  studySetId: string,
  progress: Record<string, UserTermProgress>
): boolean {
  const all = readStoredJson<Record<string, Record<string, UserTermProgress>>>(PROGRESS_KEY, {});
  all[studySetId] = progress;
  return writeStoredJson(PROGRESS_KEY, all);
}

export function saveSession(studySetId: string, session: StudySession): boolean {
  const all = readStoredJson<Record<string, StudySession[]>>(SESSIONS_KEY, {});
  const list: StudySession[] = all[studySetId] || [];
  list.push(session);
  all[studySetId] = list.slice(-50);
  return writeStoredJson(SESSIONS_KEY, all);
}

export function resetProgressForSet(studySetId: string): boolean {
  const all = readStoredJson<Record<string, Record<string, UserTermProgress>>>(PROGRESS_KEY, {});
  delete all[studySetId];
  return writeStoredJson(PROGRESS_KEY, all);
}

export function loadSettings(studySetId: string): StudySettings | null {
  const all = readStoredJson<Record<string, StudySettings>>(SETTINGS_KEY, {});
  const raw = all[studySetId];
  if (!raw) return null;
  return {
    ...raw,
    examDate: raw.examDate ? new Date(raw.examDate) : undefined,
  };
}

export function saveSettings(studySetId: string, settings: StudySettings): boolean {
  const all = readStoredJson<Record<string, StudySettings>>(SETTINGS_KEY, {});
  all[studySetId] = settings;
  return writeStoredJson(SETTINGS_KEY, all);
}

export function startSession(
  studySetId: string,
  mode: LearningMode,
  settings: StudySettings,
  totalQuestions: number
): StudySession {
  return {
    id: `session-${Date.now()}`,
    userId: DEFAULT_USER_ID,
    studySetId,
    mode,
    startTime: new Date(),
    totalQuestions,
    correctAnswers: 0,
    settings,
    termResults: [],
  };
}
