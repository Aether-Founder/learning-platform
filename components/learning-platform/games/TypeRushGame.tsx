'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import type { GameShellProps } from '@/lib/learning-platform/game-registry';
import { evaluateAnswer } from '@/lib/learning-platform/grading';
import { fisherYatesShuffle, getPromptAndAnswer } from '@/lib/learning-platform/term-filters';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import type { Term } from '@/types/learning-platform';
import { MarkdownContent } from '../shared/MarkdownContent';
import { GameShell } from '../GameShell';

export function TypeRushGame({ onQuit }: GameShellProps) {
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [terms, setTerms] = useState<Term[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [score, setLocalScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const initialized = useRef(false);
  const current = terms[index];
  const promptAndAnswer = current ? getPromptAndAnswer(current, settings.questionFormat) : null;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const sessionTerms = fisherYatesShuffle(playableTerms).slice(0, 10);
    setTerms(sessionTerms);
    beginSession('type-rush', sessionTerms.length);
  }, [beginSession, playableTerms]);

  return (
    <GameShell gameId="type-rush" onQuit={onQuit}>
      {({ reportScore, setScore }) => {
        const submit = (event: FormEvent) => {
          event.preventDefault();
          if (!current || !input.trim() || feedback) return;
          if (!promptAndAnswer) return;
          const grading = evaluateAnswer(input, promptAndAnswer.answer, settings.smartGrading);
          const isCorrect = grading.isCorrect;
          setFeedback(isCorrect ? 'correct' : 'wrong');
          const nextScore = score + (isCorrect ? 1 : 0);
          setLocalScore(nextScore);
          setScore(nextScore);
          recordAnswer(current.id, {
            questionType: 'written',
            userAnswer: input,
            correctAnswer: promptAndAnswer.answer,
            isCorrect,
            wasOverridden: false,
            timeSpent: 0,
          });
          setTimeout(
            () => {
              setFeedback(null);
              setInput('');
              if (index + 1 >= terms.length) {
                endSession(Math.round((nextScore / Math.max(terms.length, 1)) * 100));
                reportScore(nextScore);
                setComplete(true);
              } else {
                setIndex((i) => i + 1);
              }
            },
            isCorrect ? 900 : 1700
          );
        };

        if (complete) {
          return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">Type rush voltooid</p>
              <h3 className="mt-2 text-3xl font-serif font-medium">
                {score}/{terms.length}
              </h3>
            </div>
          );
        }

        if (!current) return null;

        return (
          <div className="space-y-5 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Type rush</span>
              <span className="text-muted-foreground">
                {index + 1}/{terms.length}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-background p-6 min-h-[160px]">
              <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                Typ het antwoord
              </p>
              <MarkdownContent className="text-lg">{promptAndAnswer?.prompt ?? ''}</MarkdownContent>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 bg-background text-foreground outline-none transition-colors ${
                  feedback === 'correct'
                    ? 'border-green-500 bg-green-500/10'
                    : feedback === 'wrong'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-border'
                }`}
                placeholder="Typ je antwoord..."
                autoFocus
              />
              {feedback === 'wrong' && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  Goed antwoord: {promptAndAnswer?.answer}
                </p>
              )}
              <button
                type="submit"
                disabled={!input.trim() || Boolean(feedback)}
                className="w-full rounded-xl bg-foreground py-3 text-sm font-medium text-background disabled:opacity-50"
              >
                Controleer
              </button>
            </form>
          </div>
        );
      }}
    </GameShell>
  );
}
