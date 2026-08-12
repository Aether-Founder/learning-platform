'use client';

import { useEffect, useRef, useState } from 'react';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import {
  buildLearnQuestion,
  buildMcqQuestion,
  buildWrittenQuestion,
  createId,
  pickDistractors,
} from '@/lib/learning-platform/question-generator';
import { fisherYatesShuffle, getPromptAndAnswer } from '@/lib/learning-platform/term-filters';
import type { LerenActivity, Question, Term, TermResult } from '@/types/learning-platform';
import { useTranslation } from '@/lib/i18n';
import { McqQuestion } from '../questions/McqQuestion';
import { WrittenQuestion } from '../questions/WrittenQuestion';
import { MarkdownContent } from '../shared/MarkdownContent';
import { SessionSummary } from '../SessionSummary';

interface SessionTerm extends Term {
  sessionCorrect: number;
}

interface LearnModeProps {
  useImages?: boolean;
}

export function LearnMode({ useImages = false }: LearnModeProps = {}) {
  const { t } = useTranslation();
  const { playableTerms, studySet, settings, progressMap, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();

  const [queue, setQueue] = useState<SessionTerm[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState<TermResult[]>([]);
  const activityIndex = useRef(0);
  const initialized = useRef(false);
  const lastTermId = useRef<string | null>(null);

  // Filter terms that have images when useImages is true
  const filteredPlayableTerms = useImages
    ? playableTerms.filter((term) => term.image)
    : playableTerms;

  useEffect(() => {
    if (filteredPlayableTerms.length === 0) return;
    if (initialized.current) return;
    initialized.current = true;
    const sessionQueue: SessionTerm[] = fisherYatesShuffle(filteredPlayableTerms).map((term) => ({
      ...term,
      sessionCorrect: 0,
    }));
    setQueue(sessionQueue);
    setComplete(false);
    beginSession('learn', sessionQueue.length);
  }, [filteredPlayableTerms, beginSession]);

  const allTerms = studySet?.terms ?? playableTerms;

  const activities = settings.lerenActivities?.length
    ? settings.lerenActivities
    : [settings.lerenActivity ?? 'learn'];

  const buildFlashcardQuestion = (term: Term): Question => {
    if (useImages && term.image) {
      // When using images, show the image and ask for the term
      return {
        id: createId('flash'),
        term,
        type: 'flashcard',
        prompt: `Welk begrip hoort bij deze afbeelding?`,
        correctAnswer: term.term,
        startTime: new Date(),
      };
    }
    const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
    return {
      id: createId('flash'),
      term,
      type: 'flashcard',
      prompt,
      correctAnswer: answer,
      startTime: new Date(),
    };
  };

  const buildImageMcqQuestion = (term: Term): Question => ({
    id: createId('q'),
    term,
    type: 'multiple-choice',
    prompt: 'Welk begrip hoort bij deze afbeelding?',
    correctAnswer: term.term,
    options: fisherYatesShuffle([
      term.term,
      ...pickDistractors(filteredPlayableTerms, term, 3, 'term'),
    ]),
    startTime: new Date(),
  });

  const buildQuestionForActivity = (
    activity: LerenActivity,
    term: Term,
    consecutive: number
  ): Question => {
    // When using images, only use terms with images for distractors
    const termsForDistractors = useImages ? filteredPlayableTerms : allTerms;

    if (activity === 'flashcard') return buildFlashcardQuestion(term);
    if (useImages && term.image && activity !== 'writing-only') {
      return buildImageMcqQuestion(term);
    }
    if (activity === 'multiple-choice-only') {
      const q = buildMcqQuestion(term, termsForDistractors, settings);
      return q;
    }
    if (activity === 'writing-only') {
      const q = buildWrittenQuestion(term, settings);
      // Override prompt to show image when using images
      if (useImages && term.image) {
        return {
          ...q,
          prompt: `Welk begrip hoort bij deze afbeelding?`,
          correctAnswer: term.term,
        };
      }
      return q;
    }
    const q = buildLearnQuestion(term, termsForDistractors, settings, consecutive);
    // Override prompt to show image when using images
    if (useImages && term.image) {
      return {
        ...q,
        prompt: `Welk begrip hoort bij deze afbeelding?`,
        correctAnswer: term.term,
      };
    }
    return q;
  };

  const pickNext = (terms: SessionTerm[], avoidTermId = lastTermId.current) => {
    const remaining = terms.filter((t) => t.sessionCorrect < 2);
    if (remaining.length === 0) {
      setComplete(true);
      endSession(100);
      setCurrent(null);
      return;
    }
    const candidates =
      remaining.length > 1 ? remaining.filter((t) => t.id !== avoidTermId) : remaining;
    const lowestSessionScore = Math.min(...candidates.map((t) => t.sessionCorrect));
    const weakest = candidates.filter((t) => t.sessionCorrect === lowestSessionScore);
    const term = weakest[Math.floor(Math.random() * weakest.length)];
    lastTermId.current = term.id;
    const progress = progressMap[term.id];
    const consecutive = Math.max(term.sessionCorrect, progress?.consecutiveCorrectCount ?? 0);
    const activity = activities[activityIndex.current % activities.length];
    activityIndex.current += 1;
    setCurrent(buildQuestionForActivity(activity, term, consecutive));
  };

  const pickNextRef = useRef(pickNext);
  pickNextRef.current = pickNext;

  useEffect(() => {
    if (queue.length > 0 && !current && !complete) {
      pickNextRef.current(queue);
    }
  }, [queue, current, complete]);

  const handleAnswer = (isCorrect: boolean, userAnswer: string, type: Question['type']) => {
    if (!current) return;
    const t0 = current.startTime.getTime();
    const answeredTermId = current.term.id;
    recordAnswer(current.term.id, {
      questionType: type,
      userAnswer,
      correctAnswer: current.correctAnswer,
      isCorrect,
      wasOverridden: false,
      reviewGrade: isCorrect ? (type === 'written' ? 'good' : 'hard') : 'again',
      timeSpent: Date.now() - t0,
    });
    setResults((prev) => [
      ...prev,
      {
        termId: current.term.id,
        questionType: type,
        userAnswer,
        correctAnswer: current.correctAnswer,
        isCorrect,
        wasOverridden: false,
        reviewGrade: isCorrect ? (type === 'written' ? 'good' : 'hard') : 'again',
        timeSpent: Date.now() - t0,
        timestamp: new Date(),
      },
    ]);

    const updated = queue.map((term) =>
      term.id === answeredTermId
        ? {
            ...term,
            sessionCorrect: isCorrect ? term.sessionCorrect + 1 : 0,
          }
        : term
    );
    setQueue(updated);
    setTimeout(() => pickNext(updated, answeredTermId), isCorrect ? 1100 : 1700);
  };

  if (complete) {
    return (
      <div className="text-center py-12 space-y-4">
        <SessionSummary
          terms={studySet?.terms ?? playableTerms}
          results={results}
          title={t('study_round_done', 'Ronde voltooid!')}
        />
      </div>
    );
  }

  if (!current) {
    return <p className="text-center py-8 text-muted-foreground">{t('study_loading', 'Laden…')}</p>;
  }

  const left = queue.filter((t) => t.sessionCorrect < 2).length;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground mb-4 text-center">
        {left} {t('study_terms_remaining', 'begrippen te gaan')}
      </p>
      {current.type === 'flashcard' ? (
        <div className="space-y-5">
          {useImages && current.term.image && (
            <div
              key={current.term.id}
              className="rounded-2xl border border-border bg-card p-4 flex items-center justify-center shadow-sm"
            >
              <img
                src={current.term.image}
                alt="Afbeelding"
                className="max-w-full max-h-80 object-contain"
              />
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-8 min-h-[220px] flex items-center justify-center shadow-sm">
            <MarkdownContent className="text-xl text-center font-medium">
              {current.prompt}
            </MarkdownContent>
          </div>
          <div className="rounded-xl border border-border bg-secondary/50 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Antwoord</p>
            <MarkdownContent className="text-base">{current.correctAnswer}</MarkdownContent>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAnswer(false, 'still-learning', 'flashcard')}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300"
            >
              Nog oefenen
            </button>
            <button
              type="button"
              onClick={() => handleAnswer(true, 'know-it', 'flashcard')}
              className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-300"
            >
              Weet ik
            </button>
          </div>
        </div>
      ) : current.type === 'written' ? (
        <div className="space-y-5">
          {useImages && current.term.image && (
            <div
              key={current.term.id}
              className="rounded-2xl border border-border bg-card p-4 flex items-center justify-center shadow-sm"
            >
              <img
                src={current.term.image}
                alt="Afbeelding"
                className="max-w-full max-h-80 object-contain"
              />
            </div>
          )}
          <WrittenQuestion
            question={current}
            smartGrading={settings.smartGrading}
            gradingOptions={{
              ignoreAccents: settings.gradingIgnoreAccents,
              ignoreCase: settings.gradingIgnoreCase,
              ignorePunctuation: settings.gradingIgnorePunctuation,
              typoTolerance: settings.gradingTypoTolerance,
            }}
            retypeAnswers={settings.retypeAnswers}
            onComplete={(answer, correct, overridden) =>
              handleAnswer(correct || overridden, answer, 'written')
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {useImages && current.term.image && (
            <div
              key={current.term.id}
              className="rounded-2xl border border-border bg-card p-4 flex items-center justify-center shadow-sm"
            >
              <img
                src={current.term.image}
                alt="Afbeelding"
                className="max-w-full max-h-80 object-contain"
              />
            </div>
          )}
          <McqQuestion
            key={current.id}
            question={current}
            onAnswer={(answer, correct) => handleAnswer(correct, answer, 'multiple-choice')}
          />
        </div>
      )}
    </div>
  );
}
