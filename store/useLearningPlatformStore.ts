'use client';

import { create } from 'zustand';
import { defaultStudySettings } from '@/lib/learning-platform/defaults';
import {
  applyTermProgress,
  loadProgressStore,
  loadSettings,
  mergeTermsWithProgress,
  resetProgressForSet,
  saveProgressForSet,
  saveSettings,
  saveSession,
  startSession,
} from '@/lib/learning-platform/progress-store';
import { filterPlayableTerms, prioritizeTermsForExam } from '@/lib/learning-platform/term-filters';
import { defaultSrsProgress } from '@/lib/learning-platform/srs';
import type {
  LearningMode,
  StudySession,
  StudySet,
  StudySettings,
  Term,
  TermResult,
  UserTermProgress,
} from '@/types/learning-platform';

interface LearningPlatformState {
  studySet: StudySet | null;
  activeMode: LearningMode | null;
  settings: StudySettings;
  progressMap: Record<string, UserTermProgress>;
  playableTerms: Term[];
  currentQuestionIndex: number;
  currentSession: StudySession | null;
  initialized: boolean;

  init: (set: StudySet) => void;
  setActiveMode: (mode: LearningMode | null) => void;
  updateSettings: (partial: Partial<StudySettings>) => void;
  saveSettingsToStorage: () => void;
  resetAllProgress: () => void;
  addImportedTerms: (terms: Term[]) => void;
  refreshPlayableTerms: () => void;
  recordAnswer: (termId: string, result: Omit<TermResult, 'termId' | 'timestamp'>) => void;
  toggleStar: (termId: string) => void;
  suspendTerm: (termId: string, suspended?: boolean) => void;
  buryTerm: (termId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  beginSession: (mode: LearningMode, totalQuestions: number) => void;
  endSession: (score?: number) => void;
  getTerm: (id: string) => Term | undefined;
}

export const useLearningPlatformStore = create<LearningPlatformState>((set, get) => ({
  studySet: null,
  activeMode: null,
  settings: defaultStudySettings,
  progressMap: {},
  playableTerms: [],
  currentQuestionIndex: 0,
  currentSession: null,
  initialized: false,

  init: (studySet) => {
    const stored = loadProgressStore(studySet.id);
    const savedSettings = loadSettings(studySet.id);
    const setIds = new Set(studySet.learningSets.map((set) => set.id));
    const loadedSettings = savedSettings ?? defaultStudySettings;
    const settings = {
      ...loadedSettings,
      selectedLearningSetIds: (loadedSettings.selectedLearningSetIds ?? []).filter((id) =>
        setIds.has(id)
      ),
    };
    const merged = mergeTermsWithProgress(studySet.terms, stored.progress);
    const fullSet = { ...studySet, terms: merged };
    const playable = filterPlayableTerms(
      prioritizeTermsForExam(merged, settings.examDate),
      settings
    );
    set({
      studySet: fullSet,
      settings,
      progressMap: stored.progress,
      playableTerms: playable,
      initialized: true,
      currentQuestionIndex: 0,
    });
  },

  setActiveMode: (mode) => set({ activeMode: mode, currentQuestionIndex: 0 }),

  updateSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }));
    get().refreshPlayableTerms();
  },

  saveSettingsToStorage: () => {
    const { studySet, settings } = get();
    if (studySet) saveSettings(studySet.id, settings);
  },

  resetAllProgress: () => {
    const { studySet } = get();
    if (!studySet) return;
    resetProgressForSet(studySet.id);
    const terms = studySet.terms.map((t) => ({
      ...t,
      masteryStatus: 'unstudied' as const,
      consecutiveCorrectCount: 0,
      isStarred: false,
    }));
    set({
      progressMap: {},
      studySet: { ...studySet, terms },
      playableTerms: filterPlayableTerms(terms, get().settings),
    });
  },

  addImportedTerms: (terms) => {
    const { studySet, settings, progressMap } = get();
    if (!studySet || terms.length === 0) return;
    const existingIds = new Set(studySet.terms.map((term) => term.id));
    const uniqueTerms = terms.map((term, index) => ({
      ...term,
      id: existingIds.has(term.id) ? `${term.id}-import-${Date.now()}-${index}` : term.id,
      learningSetId: term.learningSetId || 'imported',
      learningSetTitle: term.learningSetTitle || 'Geimporteerd',
    }));
    const nextSet = {
      ...studySet,
      terms: [...studySet.terms, ...uniqueTerms],
      learningSets: [
        ...studySet.learningSets.filter((set) => set.id !== 'imported'),
        {
          id: 'imported',
          title: 'Geimporteerd',
          termCount:
            uniqueTerms.length +
            studySet.terms.filter((term) => term.learningSetId === 'imported').length,
        },
      ],
      updatedAt: new Date(),
    };
    const merged = mergeTermsWithProgress(nextSet.terms, progressMap);
    set({
      studySet: { ...nextSet, terms: merged },
      playableTerms: filterPlayableTerms(
        prioritizeTermsForExam(merged, settings.examDate),
        settings
      ),
    });
  },

  refreshPlayableTerms: () => {
    const { studySet, settings, progressMap } = get();
    if (!studySet) return;
    const merged = mergeTermsWithProgress(studySet.terms, progressMap);
    const playable = filterPlayableTerms(
      prioritizeTermsForExam(merged, settings.examDate),
      settings
    );
    set({ studySet: { ...studySet, terms: merged }, playableTerms: playable });
  },

  recordAnswer: (termId, result) => {
    const { progressMap, studySet, currentSession, settings } = get();
    if (!studySet) return;

    const wasWritten = result.questionType === 'written';
    const updated = applyTermProgress(
      progressMap[termId],
      termId,
      result.isCorrect,
      wasWritten,
      settings.srsAlgorithm,
      result.reviewGrade
    );
    const nextProgress = { ...progressMap, [termId]: updated };
    saveProgressForSet(studySet.id, nextProgress);

    const terms = mergeTermsWithProgress(studySet.terms, nextProgress);
    let session = currentSession;
    if (session) {
      const termResult: TermResult = {
        termId,
        ...result,
        timestamp: new Date(),
      };
      session = {
        ...session,
        correctAnswers: session.correctAnswers + (result.isCorrect ? 1 : 0),
        termResults: [...session.termResults, termResult],
      };
    }

    set({
      progressMap: nextProgress,
      studySet: { ...studySet, terms },
      currentSession: session,
      playableTerms: filterPlayableTerms(
        prioritizeTermsForExam(terms, settings.examDate),
        settings
      ),
    });
  },

  toggleStar: (termId) => {
    const { progressMap, studySet } = get();
    if (!studySet) return;
    const existing = progressMap[termId];
    const now = new Date();
    const updated: UserTermProgress = existing
      ? { ...existing, isStarred: !existing.isStarred, updatedAt: now }
      : {
          ...defaultSrsProgress(termId, now),
          isStarred: true,
        };
    const nextProgress = { ...progressMap, [termId]: updated };
    saveProgressForSet(studySet.id, nextProgress);
    const terms = mergeTermsWithProgress(studySet.terms, nextProgress);
    set({
      progressMap: nextProgress,
      studySet: { ...studySet, terms },
    });
    get().refreshPlayableTerms();
  },

  suspendTerm: (termId, suspended) => {
    const { progressMap, studySet } = get();
    if (!studySet) return;
    const now = new Date();
    const existing = progressMap[termId] ?? defaultSrsProgress(termId, now);
    const updated: UserTermProgress = {
      ...existing,
      suspended: suspended ?? !existing.suspended,
      updatedAt: now,
    };
    const nextProgress = { ...progressMap, [termId]: updated };
    saveProgressForSet(studySet.id, nextProgress);
    const terms = mergeTermsWithProgress(studySet.terms, nextProgress);
    set({ progressMap: nextProgress, studySet: { ...studySet, terms } });
    get().refreshPlayableTerms();
  },

  buryTerm: (termId) => {
    const { progressMap, studySet } = get();
    if (!studySet) return;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(4, 0, 0, 0);
    const existing = progressMap[termId] ?? defaultSrsProgress(termId, now);
    const updated: UserTermProgress = {
      ...existing,
      buriedUntil: tomorrow,
      updatedAt: now,
    };
    const nextProgress = { ...progressMap, [termId]: updated };
    saveProgressForSet(studySet.id, nextProgress);
    const terms = mergeTermsWithProgress(studySet.terms, nextProgress);
    set({ progressMap: nextProgress, studySet: { ...studySet, terms } });
    get().refreshPlayableTerms();
  },

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  beginSession: (mode, totalQuestions) => {
    const { studySet, settings } = get();
    if (!studySet) return;
    const session = startSession(studySet.id, mode, settings, totalQuestions);
    set({ currentSession: session });
  },

  endSession: (score) => {
    const { currentSession, studySet } = get();
    if (currentSession && studySet) {
      const ended: StudySession = {
        ...currentSession,
        endTime: new Date(),
        score,
      };
      saveSession(studySet.id, ended);
    }
    set({ currentSession: null });
  },

  getTerm: (id) => get().studySet?.terms.find((t) => t.id === id),
}));
