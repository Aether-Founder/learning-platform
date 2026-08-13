'use client';

import { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';

interface ParagraphQuestion {
  id: string;
  number: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Paragraph {
  id: string;
  title?: string;
  content: string;
  questions: ParagraphQuestion[];
}

interface StudyModeProps {
  section: {
    id: string;
    title: string;
    paragraphs?: Paragraph[];
  };
}

// Helper function to convert \n to actual newlines and preserve markdown breaks
function processNewlines(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

interface FlashcardProps {
  question: ParagraphQuestion;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard = memo(function Flashcard({ question, isFlipped, onFlip }: FlashcardProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onFlip}
      className="relative w-full aspect-[4/3] cursor-pointer group"
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front - Question */}
        <div
          className="absolute inset-0 bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('question')} {question.number}
            </span>
            {question.difficulty && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  question.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : question.difficulty === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {t(`difficulty_${question.difficulty}`, question.difficulty)}
              </span>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <MarkdownRenderer className="text-lg sm:text-xl text-center text-foreground font-medium leading-relaxed">
              {processNewlines(question.question)}
            </MarkdownRenderer>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4">{t('click_to_flip')}</div>
        </div>

        {/* Back - Answer */}
        <div
          className="absolute inset-0 bg-secondary border border-border rounded-xl p-6 sm:p-8 shadow-sm flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('answer')}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <MarkdownRenderer className="text-base sm:text-lg text-foreground leading-relaxed">
              {processNewlines(question.answer)}
            </MarkdownRenderer>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-4">{t('click_to_flip')}</div>
        </div>
      </div>
    </div>
  );
});

export const StudyMode = memo(function StudyMode({ section }: StudyModeProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  // Extract all questions from paragraphs
  const allQuestions = useMemo(() => {
    const paragraphs = section.paragraphs || [];
    const questions: (ParagraphQuestion & { paragraphTitle?: string })[] = [];

    paragraphs.forEach((para) => {
      para.questions.forEach((q) => {
        questions.push({ ...q, paragraphTitle: para.title });
      });
    });

    return questions;
  }, [section.paragraphs]);

  const questions = useMemo(() => {
    if (shuffled) {
      return [...allQuestions].sort(() => Math.random() - 0.5);
    }
    return allQuestions;
  }, [allQuestions, shuffled]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % totalQuestions);
  }, [totalQuestions]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + totalQuestions) % totalQuestions);
  }, [totalQuestions]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffled((prev) => !prev);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffled(false);
  }, []);

  // Keyboard event handler for spacebar and arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keys when in study mode (this component is mounted)
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scroll
        handleFlip();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handlePrev, handleNext]);

  if (totalQuestions === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('no_results')}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-serif font-medium text-foreground mb-2">{section.title}</h2>
        <p className="text-sm text-muted-foreground">
          {t('question')} {currentIndex + 1} {t('of')} {totalQuestions}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-secondary rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      {currentQuestion && (
        <Flashcard question={currentQuestion} isFlipped={isFlipped} onFlip={handleFlip} />
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={handlePrev}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title={t('previous_question')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleFlip}
          className="px-6 py-3 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
        >
          {isFlipped ? t('show_question') : t('show_answer')}
        </button>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          title={t('next_question')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Additional Controls */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={handleShuffle}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
            shuffled
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
              : 'bg-secondary hover:bg-secondary/80'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          {shuffled ? t('shuffled') : t('shuffle')}
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('reset')}
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-8 text-center text-xs text-muted-foreground">{t('keyboard_hint')}</div>
    </div>
  );
});
