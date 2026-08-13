'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import { getPromptAndAnswer } from '@/lib/learning-platform/term-filters';
import { useTranslation } from '@/lib/useTranslation';
import type { ReviewGrade } from '@/types/learning-platform';
import { MarkdownContent } from '../shared/MarkdownContent';

export function EnhancedFlashcardMode() {
  const { t } = useTranslation();
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  const term = playableTerms[index];
  const total = playableTerms.length;

  useEffect(() => {
    if (!started && total > 0) {
      beginSession('flashcard', total);
      setStarted(true);
    }
  }, [started, total, beginSession]);

  const advance = useCallback(
    (grade: ReviewGrade) => {
      if (!term) return;
      const isCorrect = grade !== 'again';
      recordAnswer(term.id, {
        questionType: 'flashcard',
        userAnswer: grade,
        correctAnswer: term.definition,
        isCorrect,
        wasOverridden: false,
        reviewGrade: grade,
        timeSpent: Date.now() - startedAt,
      });
      setFlipped(false);
      setStartedAt(Date.now());
      if (index + 1 >= total) {
        endSession();
        setIndex(0);
      } else {
        setIndex((i) => i + 1);
      }
    },
    [term, index, total, recordAnswer, endSession, startedAt]
  );

  const handleNext = useCallback(() => {
    setFlipped(false);
    setStartedAt(Date.now());
    setIndex((i) => (i + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setStartedAt(Date.now());
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, handlePrev, handleNext]);

  if (!term) {
    return <p className="text-center text-muted-foreground py-12">No terms to study.</p>;
  }

  const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Card {index + 1} of {total}
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className="relative w-full aspect-[4/3] cursor-pointer"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-[400ms]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl border border-border bg-card p-8 flex items-center justify-center shadow-sm"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <MarkdownContent className="text-xl text-center font-medium">{prompt}</MarkdownContent>
          </div>
          <div
            className="absolute inset-0 rounded-xl border border-border bg-secondary p-8 flex items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <MarkdownContent className="text-lg text-center">{answer}</MarkdownContent>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">Space to flip · ← → to navigate</p>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={handlePrev}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
        >
          {flipped ? t('flash_show_prompt', 'Toon vraag') : t('flash_flip', 'Draai om')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              [
                'again',
                'Opnieuw',
                'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300',
              ],
              [
                'hard',
                'Moeilijk',
                'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300',
              ],
              ['good', 'Goed', 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'],
              [
                'easy',
                'Makkelijk',
                'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300',
              ],
            ] as [ReviewGrade, string, string][]
          ).map(([grade, label, classes]) => (
            <button
              key={grade}
              type="button"
              onClick={() => advance(grade)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${classes}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
