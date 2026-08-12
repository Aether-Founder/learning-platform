"use client";

import { useEffect, useRef, useState } from "react";
import { buildWrittenQuestion } from "@/lib/learning-platform/question-generator";
import { fisherYatesShuffle } from "@/lib/learning-platform/term-filters";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import type { Question, Term, TermResult } from "@/types/learning-platform";
import { SessionSummary } from "../SessionSummary";
import { WrittenQuestion } from "../questions/WrittenQuestion";

export function WritingOnlyMode() {
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [sessionTerms, setSessionTerms] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState<TermResult[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const terms = fisherYatesShuffle(playableTerms);
    setSessionTerms(terms);
    beginSession("writing-only", terms.length);
  }, [beginSession, playableTerms]);

  useEffect(() => {
    setQuestion(sessionTerms[index] ? buildWrittenQuestion(sessionTerms[index], settings) : null);
  }, [index, sessionTerms, settings]);

  const onComplete = (answer: string, correct: boolean, overridden: boolean) => {
    if (!question) return;
    const isCorrect = correct || overridden;
    const timeSpent = Date.now() - question.startTime.getTime();

    recordAnswer(question.term.id, {
      questionType: "written",
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      wasOverridden: overridden,
      reviewGrade: isCorrect ? "good" : "again",
      timeSpent,
    });
    setResults((prev) => [
      ...prev,
      {
        termId: question.term.id,
        questionType: "written",
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        wasOverridden: overridden,
        reviewGrade: isCorrect ? "good" : "again",
        timeSpent,
        timestamp: new Date(),
      },
    ]);

    const nextStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1,
    };
    setStats(nextStats);

    if (index + 1 >= sessionTerms.length) {
      endSession(Math.round((nextStats.correct / Math.max(sessionTerms.length, 1)) * 100));
      setComplete(true);
    } else {
      setIndex((i) => i + 1);
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
        {index + 1} / {sessionTerms.length} - Accuracy{" "}
        {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
      </p>
      <WrittenQuestion
        key={question.id}
        question={question}
        smartGrading={settings.smartGrading}
        gradingOptions={{
          ignoreAccents: settings.gradingIgnoreAccents,
          ignoreCase: settings.gradingIgnoreCase,
          ignorePunctuation: settings.gradingIgnorePunctuation,
          typoTolerance: settings.gradingTypoTolerance,
        }}
        retypeAnswers={settings.retypeAnswers}
        onComplete={onComplete}
      />
    </div>
  );
}
