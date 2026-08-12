'use client';

import { useEffect, useRef, useState } from 'react';
import { buildMcqQuestion } from '@/lib/learning-platform/question-generator';
import { fisherYatesShuffle } from '@/lib/learning-platform/term-filters';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import type { Question, Term, TermResult } from '@/types/learning-platform';
import { McqQuestion } from '../questions/McqQuestion';
import { SessionSummary } from '../SessionSummary';

export function McqOnlyMode() {
  const { playableTerms, studySet, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState<TermResult[]>([]);
  const initialized = useRef(false);
  const distractorTerms = useRef<Term[]>([]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const terms = fisherYatesShuffle(playableTerms);
    setSessionTerms(terms);
    distractorTerms.current = studySet?.terms ?? terms;
    beginSession('multiple-choice-only', terms.length);
  }, [beginSession, playableTerms, studySet?.terms]);

  useEffect(() => {
    setQuestion(
      sessionTerms[index]
        ? buildMcqQuestion(sessionTerms[index], distractorTerms.current, settings)
        : null
    );
  }, [index, sessionTerms, settings]);

  const onAnswer = (answer: string, correct: boolean) => {
    if (!question) return;
    recordAnswer(question.term.id, {
      questionType: 'multiple-choice',
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: correct,
      wasOverridden: false,
      reviewGrade: correct ? 'hard' : 'again',
      timeSpent: Date.now() - question.startTime.getTime(),
    });
    setResults((prev) => [
      ...prev,
      {
        termId: question.term.id,
        questionType: 'multiple-choice',
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect: correct,
        wasOverridden: false,
        reviewGrade: correct ? 'hard' : 'again',
        timeSpent: Date.now() - question.startTime.getTime(),
        timestamp: new Date(),
      },
    ]);

    const nextStats = {
      correct: stats.correct + (correct ? 1 : 0),
      total: stats.total + 1,
    };
    setStats(nextStats);

    if (index + 1 >= sessionTerms.length) {
      endSession(Math.round((nextStats.correct / Math.max(sessionTerms.length, 1)) * 100));
      setTimeout(() => setComplete(true), correct ? 1100 : 1700);
    } else {
      setTimeout(() => setIndex((i) => i + 1), correct ? 1100 : 1700);
    }
  };

  if (complete) {
    return (
      <div className="max-w-3xl mx-auto">
        <SessionSummary terms={sessionTerms} results={results} />
      </div>
    );
  }

  if (sessionTerms.length === 0) {
    return <p className="text-center py-8 text-muted-foreground">Geen begrippen om te oefenen.</p>;
  }

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm text-center text-muted-foreground mb-4">
        {index + 1} / {sessionTerms.length} - Accuracy{' '}
        {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
      </p>
      <McqQuestion key={question.id} question={question} onAnswer={onAnswer} />
    </div>
  );
}
