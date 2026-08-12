"use client";

import { useEffect, useRef, useState } from "react";
import type { GameShellProps } from "@/lib/learning-platform/game-registry";
import { buildMcqQuestion } from "@/lib/learning-platform/question-generator";
import { fisherYatesShuffle } from "@/lib/learning-platform/term-filters";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import type { Question, Term } from "@/types/learning-platform";
import { McqQuestion } from "../questions/McqQuestion";
import { GameShell } from "../GameShell";

export function QuizSprintGame({ onQuit }: GameShellProps) {
  const { playableTerms, studySet, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [complete, setComplete] = useState(false);
  const [terms, setTerms] = useState<Term[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const initialized = useRef(false);
  const distractorTerms = useRef<Term[]>([]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const sessionTerms = fisherYatesShuffle(playableTerms).slice(0, 12);
    setTerms(sessionTerms);
    distractorTerms.current = studySet?.terms ?? sessionTerms;
    beginSession("sprint", sessionTerms.length);
  }, [beginSession, playableTerms]);

  useEffect(() => {
    setQuestion(terms[index] ? buildMcqQuestion(terms[index], distractorTerms.current, settings) : null);
  }, [index, terms, settings]);

  return (
    <GameShell gameId="sprint" onQuit={onQuit}>
      {({ reportScore, setScore }) => {
        const answer = (value: string, isCorrect: boolean) => {
          if (!question) return;
          const nextCorrect = correct + (isCorrect ? 1 : 0);
          recordAnswer(question.term.id, {
            questionType: "multiple-choice",
            userAnswer: value,
            correctAnswer: question.correctAnswer,
            isCorrect,
            wasOverridden: false,
            timeSpent: 0,
          });
          setCorrect(nextCorrect);
          setScore(nextCorrect);
          if (index + 1 >= terms.length) {
            endSession(Math.round((nextCorrect / Math.max(terms.length, 1)) * 100));
            setTimeout(() => {
              reportScore(nextCorrect);
              setComplete(true);
            }, 1200);
          } else {
            setTimeout(() => setIndex((i) => i + 1), isCorrect ? 900 : 1500);
          }
        };

        if (complete) {
          return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Sprint voltooid</p>
              <h3 className="mt-2 text-3xl font-serif font-medium">{correct}/{terms.length}</h3>
              <p className="mt-2 text-sm text-muted-foreground">Probeer opnieuw voor een hogere score.</p>
            </div>
          );
        }

        if (!question) return null;

        return (
          <div className="space-y-5 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Quiz sprint</span>
              <span className="text-muted-foreground">{index + 1}/{terms.length}</span>
            </div>
            <McqQuestion key={question.id} question={question} onAnswer={answer} />
          </div>
        );
      }}
    </GameShell>
  );
}
