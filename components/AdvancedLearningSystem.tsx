'use client';

import { FormEvent, memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  defaultPreferences,
  forecastDueCards,
  generateOptions,
  getDueCards,
  loadLearningState,
  qualityFromSimilarity,
  saveLearningState,
  shuffle,
  similarityPercent,
  updateProgress,
  type LearningSet,
  type LearningState,
  type ResponseQuality,
  type StudyCard,
  type StudyModeId,
  type StudyResponse,
} from '@/lib/learning-system';
import { useTranslation } from '@/lib/useTranslation';
import { useAnalytics } from '@/lib/analytics';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  BarChart3,
  BookOpenCheck,
  Check,
  Keyboard,
  ListChecks,
  RotateCcw,
  Settings,
} from 'lucide-react';

interface ParagraphQuestion {
  id: string;
  number: string;
  question: string;
  answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Paragraph {
  questions: ParagraphQuestion[];
}

interface SourceSection {
  id: string;
  title: string;
  paragraphs?: Paragraph[];
}

interface AdvancedLearningSystemProps {
  sourceSections?: SourceSection[];
}

function processNewlines(text: string) {
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

function setFromSections(sections: SourceSection[]): LearningSet | undefined {
  const cards = sections.flatMap((section) =>
    (section.paragraphs || []).flatMap((paragraph) =>
      paragraph.questions.map((question) => ({
        front: question.question,
        back: question.answer,
        difficulty: question.difficulty,
      }))
    )
  );

  if (cards.length === 0) return undefined;
  const now = new Date().toISOString();

  return {
    id: `content-${sections.map((section) => section.id).join('-')}`,
    name: sections.length === 1 ? sections[0].title : 'Current study guide',
    description: '',
    category: 'Page content',
    dailyNewLimit: 20,
    createdAt: now,
    updatedAt: now,
    cards: cards.map((card, index) => ({
      id: `content-card-${index}-${card.front.slice(0, 16)}`,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
      type: 'basic',
      createdAt: now,
      updatedAt: now,
    })),
  };
}

function CardContent({ children }: { children: string }) {
  return (
    <MarkdownRenderer className="text-[15px] leading-relaxed text-foreground">
      {processNewlines(children)}
    </MarkdownRenderer>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function qualityClasses(quality: ResponseQuality) {
  if (quality === 'easy') return 'bg-emerald-600 text-white';
  if (quality === 'good') return 'bg-sky-600 text-white';
  if (quality === 'hard') return 'bg-amber-500 text-white';
  return 'bg-rose-600 text-white';
}

const modes: StudyModeId[] = ['flashcard', 'multiple-choice', 'typing', 'matching'];

function StudySession({
  studySet,
  state,
  onStateChange,
}: {
  studySet: LearningSet;
  state: LearningState;
  onStateChange: (state: LearningState) => void;
}) {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const [mode, setMode] = useState<StudyModeId>(state.preferences.mode);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [responses, setResponses] = useState<StudyResponse[]>([]);
  const [summary, setSummary] = useState<StudyResponse[] | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typingResult, setTypingResult] = useState<{
    percent: number;
    quality: ResponseQuality;
  } | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [matchAttempts, setMatchAttempts] = useState(0);

  const sessionCards = useMemo(() => {
    const due = getDueCards(studySet, state.progress, state.preferences.srsAlgorithm);
    const newCards = studySet.cards.filter((card) => !state.progress[card.id]);
    const source =
      state.preferences.reviewMix === 'due'
        ? due
        : state.preferences.reviewMix === 'new'
          ? newCards
          : [
              ...due,
              ...studySet.cards.filter((card) => !due.some((dueCard) => dueCard.id === card.id)),
            ];
    return source.slice(0, state.preferences.cardLimit || source.length || studySet.cards.length);
  }, [
    state.preferences.cardLimit,
    state.preferences.reviewMix,
    state.preferences.srsAlgorithm,
    state.progress,
    studySet,
  ]);

  const currentCard = sessionCards[index];
  const options = useMemo(
    () => (currentCard ? generateOptions(studySet.cards, currentCard) : []),
    [currentCard, studySet.cards]
  );
  const matchingCards = useMemo(() => shuffle(sessionCards.slice(0, 6)), [sessionCards]);
  const matchingAnswers = useMemo(() => shuffle(matchingCards), [matchingCards]);

  function resetCard() {
    setIsFlipped(false);
    setSelectedChoice(null);
    setTypedAnswer('');
    setTypingResult(null);
    setStartedAt(Date.now());
  }

  function saveResponse(response: StudyResponse, nextResponses: StudyResponse[]) {
    const progress = {
      ...state.progress,
      [response.cardId]: updateProgress(state.progress[response.cardId], response),
    };
    const reviewed = state.stats.cardsReviewed + 1;
    const totalTime = state.stats.totalStudyTimeMs + response.timeMs;
    const stats = {
      ...state.stats,
      cardsReviewed: reviewed,
      totalStudyTimeMs: totalTime,
      responses: {
        ...state.stats.responses,
        [response.quality]: state.stats.responses[response.quality] + 1,
      },
    };

    const completed = nextResponses.length >= sessionCards.length;
    const finalStats = completed
      ? { ...stats, sessionsCompleted: stats.sessionsCompleted + 1 }
      : stats;
    onStateChange({
      ...state,
      progress,
      stats: finalStats,
      preferences: { ...state.preferences, mode },
    });
    setResponses(nextResponses);

    // Track flashcard answer
    track('flashcard_answer', {
      cardId: response.cardId,
      quality: response.quality,
      isCorrect: response.isCorrect,
      timeMs: response.timeMs,
      mode,
    });

    if (completed) {
      setSummary(nextResponses);
    } else {
      setIndex((value) => value + 1);
      resetCard();
    }
  }

  function answer(
    quality: ResponseQuality,
    isCorrect = quality !== 'again',
    card: StudyCard | undefined = currentCard
  ) {
    if (!card) return;
    const response = { cardId: card.id, quality, isCorrect, timeMs: Date.now() - startedAt };
    saveResponse(response, [...responses, response]);
  }

  const answerRef = useRef(answer);
  const trackRef = useRef(track);
  answerRef.current = answer;
  trackRef.current = track;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (summary || !currentCard) return;
      if (mode === 'flashcard') {
        if (event.code === 'Space') {
          event.preventDefault();
          const newFlipped = !isFlipped;
          setIsFlipped(newFlipped);
          // Track flashcard flip
          if (newFlipped) {
            trackRef.current('flashcard_flip', { cardId: currentCard.id, mode });
          }
        }
        if (isFlipped && ['Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
          event.preventDefault();
          answerRef.current(
            (['again', 'hard', 'good', 'easy'] as ResponseQuality[])[
              Number(event.code.replace('Digit', '')) - 1
            ]
          );
        }
      }
      if (mode === 'multiple-choice' && ['KeyA', 'KeyB', 'KeyC', 'KeyD'].includes(event.code)) {
        const optionIndex = event.code.charCodeAt(3) - 65;
        const choice = options[optionIndex];
        if (choice) {
          setSelectedChoice(choice);
          window.setTimeout(
            () =>
              answerRef.current(
                choice === currentCard.back ? 'good' : 'again',
                choice === currentCard.back
              ),
            500
          );
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentCard, isFlipped, mode, options, summary]);

  if (sessionCards.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        {t('advanced_no_cards_due', 'No cards are due right now.')}
      </div>
    );
  }

  if (summary) {
    const correct = summary.filter((response) => response.isCorrect).length;
    const totalTime = Math.round(
      summary.reduce((sum, response) => sum + response.timeMs, 0) / 1000
    );

    return (
      <section className="rounded-md border border-border bg-card p-6">
        <h3 className="text-xl font-semibold text-foreground">
          {t('advanced_session_complete', 'Session complete')}
        </h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatPill
            icon={<ListChecks className="h-4 w-4" />}
            label={t('advanced_cards', 'Cards')}
            value={summary.length}
          />
          <StatPill
            icon={<Check className="h-4 w-4" />}
            label={t('advanced_correct', 'Correct')}
            value={`${correct}/${summary.length}`}
          />
          <StatPill
            icon={<BarChart3 className="h-4 w-4" />}
            label={t('advanced_time', 'Time')}
            value={`${totalTime}s`}
          />
        </div>
        <button
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          onClick={() => {
            setIndex(0);
            setResponses([]);
            setSummary(null);
            resetCard();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          {t('advanced_study_again', 'Study again')}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{studySet.name}</h3>
            <p className="text-sm text-muted-foreground">
              {t('advanced_card_progress', 'Card')} {index + 1} {t('of', 'of')}{' '}
              {sessionCards.length}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-secondary/70 p-1 sm:flex">
            {modes.map((item) => (
              <button
                key={item}
                className={`rounded px-3 py-2 text-xs font-medium transition-colors ${mode === item ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => {
                  setMode(item);
                  setIndex(0);
                  setResponses([]);
                  resetCard();
                }}
              >
                {t(`advanced_mode_${item}`, item)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${((index + 1) / sessionCards.length) * 100}%` }}
          />
        </div>
      </section>

      {currentCard && mode === 'flashcard' && (
        <section className="space-y-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                setIsFlipped((value) => !value);
              }
            }}
            aria-pressed={isFlipped}
            className="min-h-[260px] w-full rounded-md border border-border bg-card p-6 text-left shadow-sm cursor-pointer"
          >
            <p className="mb-4 text-xs font-medium uppercase text-muted-foreground">
              {isFlipped ? t('answer', 'Answer') : t('question', 'Question')}
            </p>
            <CardContent>{isFlipped ? currentCard.back : currentCard.front}</CardContent>
          </div>
          {isFlipped ? (
            <div className="grid gap-2 sm:grid-cols-4">
              {(['again', 'hard', 'good', 'easy'] as ResponseQuality[]).map((quality, idx) => (
                <button
                  key={quality}
                  className={`rounded-md px-4 py-3 text-sm font-semibold ${qualityClasses(quality)}`}
                  onClick={() => answer(quality)}
                >
                  {idx + 1}. {t(`advanced_quality_${quality}`, quality)}
                </button>
              ))}
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Keyboard className="h-3.5 w-3.5" />
              {t('advanced_flashcard_keys', 'Space flips, 1-4 records after reveal.')}
            </p>
          )}
        </section>
      )}

      {currentCard && mode === 'multiple-choice' && (
        <section className="rounded-md border border-border bg-card p-6">
          <p className="mb-4 text-xs font-medium uppercase text-muted-foreground">
            {t('question', 'Question')}
          </p>
          <CardContent>{currentCard.front}</CardContent>
          <div className="mt-6 grid gap-3">
            {options.map((option, optionIndex) => {
              const selected = selectedChoice === option;
              const correct = option === currentCard.back;
              return (
                <button
                  key={`${option}-${optionIndex}`}
                  disabled={Boolean(selectedChoice)}
                  onClick={() => {
                    setSelectedChoice(option);
                    window.setTimeout(() => answer(correct ? 'good' : 'again', correct), 500);
                  }}
                  className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${selectedChoice ? (correct ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : selected ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : 'border-border') : 'border-border hover:bg-secondary'}`}
                >
                  <span className="mr-2 font-semibold">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {currentCard && mode === 'typing' && (
        <form
          className="rounded-md border border-border bg-card p-6"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            const percent = similarityPercent(typedAnswer, currentCard.back);
            setTypingResult({ percent, quality: qualityFromSimilarity(percent) });
          }}
        >
          <p className="mb-4 text-xs font-medium uppercase text-muted-foreground">
            {t('question', 'Question')}
          </p>
          <CardContent>{currentCard.front}</CardContent>
          <textarea
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            className="mt-5 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder={t('advanced_type_placeholder', 'Type your answer')}
          />
          {typingResult ? (
            <div className="mt-4 rounded-md bg-secondary p-4 text-sm">
              <p className="font-medium text-foreground">
                {t('advanced_similarity', 'Similarity')}: {typingResult.percent}%
              </p>
              <div className="mt-3 text-muted-foreground">
                <CardContent>{currentCard.back}</CardContent>
              </div>
              <button
                type="button"
                className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
                onClick={() =>
                  answer(
                    typingResult.quality,
                    typingResult.percent >= state.preferences.fuzzyThreshold
                  )
                }
              >
                {t('advanced_continue', 'Continue')}
              </button>
            </div>
          ) : (
            <button className="mt-4 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
              {t('advanced_check_answer', 'Check answer')}
            </button>
          )}
        </form>
      )}

      {mode === 'matching' && (
        <section className="rounded-md border border-border bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">
                {t('advanced_match_pairs', 'Match the pairs')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {matchedIds.size} {t('of', 'of')} {matchingCards.length}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {matchAttempts} {t('advanced_attempts', 'attempts')}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {matchingCards.map((card) => (
                <button
                  key={card.id}
                  disabled={matchedIds.has(card.id)}
                  onClick={() => setSelectedQuestion(card.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${matchedIds.has(card.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : selectedQuestion === card.id ? 'border-foreground bg-secondary' : 'border-border hover:bg-secondary'}`}
                >
                  {card.front}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {matchingAnswers.map((card) => (
                <button
                  key={card.id}
                  disabled={matchedIds.has(card.id)}
                  onClick={() => {
                    if (!selectedQuestion) return;
                    setMatchAttempts((value) => value + 1);
                    if (selectedQuestion === card.id) {
                      const next = new Set(matchedIds).add(card.id);
                      setMatchedIds(next);
                      if (next.size === matchingCards.length) {
                        const accuracy =
                          matchingCards.length / Math.max(matchAttempts + 1, matchingCards.length);
                        const quality: ResponseQuality = accuracy >= 0.8 ? 'good' : 'hard';
                        const allResponses = matchingCards.map((matchCard) => ({
                          cardId: matchCard.id,
                          quality,
                          isCorrect: true,
                          timeMs: Date.now() - startedAt,
                        }));
                        const progress = { ...state.progress };
                        allResponses.forEach((response) => {
                          progress[response.cardId] = updateProgress(
                            progress[response.cardId],
                            response
                          );
                        });
                        onStateChange({
                          ...state,
                          progress,
                          stats: {
                            ...state.stats,
                            cardsReviewed: state.stats.cardsReviewed + allResponses.length,
                            sessionsCompleted: state.stats.sessionsCompleted + 1,
                            totalStudyTimeMs:
                              state.stats.totalStudyTimeMs +
                              allResponses.reduce((sum, response) => sum + response.timeMs, 0),
                          },
                        });
                        setSummary(allResponses);
                      }
                    }
                    setSelectedQuestion(null);
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${matchedIds.has(card.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-border hover:bg-secondary'}`}
                >
                  {card.back}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export const AdvancedLearningSystem = memo(function AdvancedLearningSystem({
  sourceSections,
}: AdvancedLearningSystemProps) {
  const { t } = useTranslation();
  const generatedSet = useMemo(
    () => (sourceSections ? setFromSections(sourceSections) : undefined),
    [sourceSections]
  );
  const [state, setState] = useState<LearningState>({
    sets: [],
    progress: {},
    stats: loadLearningState().stats,
    preferences: defaultPreferences,
  });
  const [tab, setTab] = useState<'study' | 'stats' | 'settings'>('study');

  useEffect(() => {
    const loaded = loadLearningState();
    setState({ ...loaded, sets: generatedSet ? [generatedSet] : [] });
  }, [generatedSet]);

  function updateState(next: LearningState) {
    setState(next);
    saveLearningState({ ...next, sets: [] });
  }

  if (!generatedSet) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        {t('advanced_no_cards', 'No study questions are available for this page.')}
      </div>
    );
  }

  const dueCount = getDueCards(generatedSet, state.progress, state.preferences.srsAlgorithm).length;
  const forecast = forecastDueCards(generatedSet, state.progress, state.preferences.srsAlgorithm);
  const correct = state.stats.responses.good + state.stats.responses.easy;
  const accuracy = state.stats.cardsReviewed
    ? Math.round((correct / state.stats.cardsReviewed) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('advanced_label', 'Advanced study')}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">
              {t('advanced_title', 'Study dashboard')}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
            <StatPill
              icon={<BookOpenCheck className="h-4 w-4" />}
              label={t('advanced_due', 'Due')}
              value={dueCount}
            />
            <StatPill
              icon={<ListChecks className="h-4 w-4" />}
              label={t('advanced_reviewed', 'Reviewed')}
              value={state.stats.cardsReviewed}
            />
            <StatPill
              icon={<Check className="h-4 w-4" />}
              label={t('advanced_accuracy', 'Accuracy')}
              value={`${accuracy}%`}
            />
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-2 rounded-md border border-border bg-card p-2">
        {[
          ['study', BookOpenCheck, t('advanced_tab_study', 'Study')],
          ['stats', BarChart3, t('advanced_tab_stats', 'Progress')],
          ['settings', Settings, t('settings', 'Settings')],
        ].map(([id, Icon, label]) => {
          const LucideIcon = Icon as typeof BookOpenCheck;
          return (
            <button
              key={id as string}
              onClick={() => setTab(id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${tab === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <LucideIcon className="h-4 w-4" />
              {label as string}
            </button>
          );
        })}
      </nav>

      {tab === 'study' && (
        <StudySession studySet={generatedSet} state={state} onStateChange={updateState} />
      )}

      {tab === 'stats' && (
        <section className="space-y-5 rounded-md border border-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill
              icon={<ListChecks className="h-4 w-4" />}
              label={t('advanced_sessions', 'Sessions')}
              value={state.stats.sessionsCompleted}
            />
            <StatPill
              icon={<BarChart3 className="h-4 w-4" />}
              label={t('advanced_time', 'Time')}
              value={`${Math.round(state.stats.totalStudyTimeMs / 60000)}m`}
            />
            <StatPill
              icon={<Check className="h-4 w-4" />}
              label={t('advanced_cards', 'Cards')}
              value={generatedSet.cards.length}
            />
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-foreground">
              {t('advanced_forecast', '7 day forecast')}
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {forecast.map((day) => (
                <div key={day.date} className="rounded-md bg-secondary p-2 text-center text-xs">
                  <strong className="block text-foreground">{day.count}</strong>
                  <span className="text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section className="grid gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            {t('advanced_card_limit', 'Card limit')}
            <input
              type="number"
              min={1}
              value={state.preferences.cardLimit}
              onChange={(event) =>
                updateState({
                  ...state,
                  preferences: { ...state.preferences, cardLimit: Number(event.target.value) },
                })
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-medium text-foreground">
            {t('advanced_fuzzy_threshold', 'Fuzzy threshold')}
            <input
              type="range"
              min={70}
              max={95}
              value={state.preferences.fuzzyThreshold}
              onChange={(event) =>
                updateState({
                  ...state,
                  preferences: { ...state.preferences, fuzzyThreshold: Number(event.target.value) },
                })
              }
              className="mt-3 w-full"
            />
            <span className="text-muted-foreground">{state.preferences.fuzzyThreshold}%</span>
          </label>
          <label className="text-sm font-medium text-foreground">
            {t('advanced_srs_algorithm', 'SRS algorithm')}
            <select
              value={state.preferences.srsAlgorithm}
              onChange={(event) =>
                updateState({
                  ...state,
                  preferences: {
                    ...state.preferences,
                    srsAlgorithm: event.target.value as 'sm2' | 'fsrs',
                  },
                })
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
            >
              <option value="sm2">SM-2</option>
              <option value="fsrs">FSRS</option>
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            {t('advanced_review_mix', 'Review mix')}
            <select
              value={state.preferences.reviewMix}
              onChange={(event) =>
                updateState({
                  ...state,
                  preferences: {
                    ...state.preferences,
                    reviewMix: event.target.value as 'due' | 'new' | 'mix',
                  },
                })
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
            >
              <option value="mix">{t('advanced_review_mix_all', 'Due and new')}</option>
              <option value="due">{t('advanced_review_mix_due', 'Due only')}</option>
              <option value="new">{t('advanced_review_mix_new', 'New only')}</option>
            </select>
          </label>
        </section>
      )}
    </div>
  );
});
