'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Clock, Flame, Star, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fisherYatesShuffle } from '@/lib/learning-platform/term-filters';
import type { GameShellProps } from '@/lib/learning-platform/game-registry';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import { useTranslation } from '@/lib/i18n';
import { MarkdownContent } from '../shared/MarkdownContent';
import { GameShell } from '../GameShell';

interface PairRow {
  termId: string;
  term: string;
  definition: string;
  matched: boolean;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIGS: Record<
  Difficulty,
  { timeLimit: number; pairsCount: number; points: number }
> = {
  easy: { timeLimit: 180, pairsCount: 6, points: 10 },
  medium: { timeLimit: 120, pairsCount: 8, points: 15 },
  hard: { timeLimit: 90, pairsCount: 10, points: 20 },
};

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MatchGame({ onQuit }: GameShellProps) {
  const { t } = useTranslation();
  const { playableTerms, recordAnswer, beginSession, endSession } = useLearningPlatformStore();
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [terms, setTerms] = useState<PairRow[]>([]);
  const [defs, setDefs] = useState<PairRow[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(DIFFICULTY_CONFIGS.medium.timeLimit);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [matches, setMatches] = useState(0);
  const [misses, setMisses] = useState(0);
  const reportedRef = useRef(false);
  const reportRef = useRef<(score: number) => void>(() => {});

  const availableCount = playableTerms.length;
  const config = DIFFICULTY_CONFIGS[difficulty];
  const targetPairs = Math.min(config.pairsCount, availableCount);

  const difficultyOptions = useMemo(
    () => [
      { id: 'easy' as const, label: t('study_difficulty_easy', 'Makkelijk') },
      { id: 'medium' as const, label: t('study_difficulty_medium', 'Middel') },
      { id: 'hard' as const, label: t('study_difficulty_hard', 'Moeilijk') },
    ],
    [t]
  );

  const resetGame = useCallback(
    (nextDifficulty = difficulty) => {
      const nextConfig = DIFFICULTY_CONFIGS[nextDifficulty];
      const selectedPairs = fisherYatesShuffle(playableTerms)
        .slice(0, Math.min(nextConfig.pairsCount, playableTerms.length))
        .map((term) => ({
          termId: term.id,
          term: term.term,
          definition: term.definition,
          matched: false,
        }));

      setPairs(selectedPairs);
      setTerms(fisherYatesShuffle(selectedPairs));
      setDefs(fisherYatesShuffle(selectedPairs));
      setSelectedTermId(null);
      setSelectedDefId(null);
      setShake(false);
      setStarted(false);
      setComplete(false);
      setGameOver(false);
      setElapsed(0);
      setTimeRemaining(nextConfig.timeLimit);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setMatches(0);
      setMisses(0);
      reportedRef.current = false;
    },
    [difficulty, playableTerms]
  );

  useEffect(() => {
    resetGame(difficulty);
    beginSession('match', targetPairs);
  }, [resetGame, beginSession, targetPairs, difficulty]);

  useEffect(() => {
    if (!started || complete) return;
    const id = setInterval(() => {
      setElapsed((value) => value + 1);
      setTimeRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [started, complete]);

  useEffect(() => {
    if (timeRemaining <= 0 && started && !complete) {
      setGameOver(true);
      setComplete(true);
    }
  }, [timeRemaining, started, complete]);

  useEffect(() => {
    if (!complete || reportedRef.current) return;
    reportedRef.current = true;
    reportRef.current(score);
    endSession();
  }, [complete, score, endSession]);

  const tryMatch = useCallback(
    (termId: string, defTermId: string) => {
      if (termId !== defTermId) {
        setShake(true);
        setMisses((value) => value + 1);
        setCombo(0);
        setTimeout(() => {
          setShake(false);
          setSelectedTermId(null);
          setSelectedDefId(null);
        }, 550);
        return;
      }

      const nextCombo = combo + 1;
      const points = config.points + nextCombo * 2;
      const nextMatches = matches + 1;
      setScore((value) => value + points);
      setCombo(nextCombo);
      setMaxCombo((value) => Math.max(value, nextCombo));
      setMatches(nextMatches);
      setPairs((prev) =>
        prev.map((pair) => (pair.termId === termId ? { ...pair, matched: true } : pair))
      );
      setTerms((prev) =>
        prev.map((pair) => (pair.termId === termId ? { ...pair, matched: true } : pair))
      );
      setDefs((prev) =>
        prev.map((pair) => (pair.termId === termId ? { ...pair, matched: true } : pair))
      );
      recordAnswer(termId, {
        questionType: 'flashcard',
        userAnswer: 'match',
        correctAnswer: 'match',
        isCorrect: true,
        wasOverridden: false,
        timeSpent: elapsed * 1000,
      });
      setSelectedTermId(null);
      setSelectedDefId(null);

      if (nextMatches >= pairs.length) {
        setComplete(true);
      }
    },
    [combo, matches, config, pairs, elapsed, recordAnswer]
  );

  useEffect(() => {
    if (selectedTermId && selectedDefId) tryMatch(selectedTermId, selectedDefId);
  }, [selectedTermId, selectedDefId, tryMatch]);

  return (
    <GameShell gameId="match" onQuit={onQuit}>
      {({ reportScore }) => {
        reportRef.current = reportScore;

        if (availableCount < 2) {
          return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Minstens 2 begrippen nodig voor het koppelspel.
              </p>
            </div>
          );
        }

        if (complete) {
          return (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-serif">
                  {gameOver
                    ? t('study_time_up', 'Tijd om!')
                    : t('study_match_done', 'Alles gekoppeld!')}
                </h3>
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  {score} punten
                </Badge>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  <Flame className="w-4 h-4 mr-2" />
                  Max Combo: {maxCombo}x
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {t('study_time', 'Tijd')}: {formatTime(elapsed)}
                </p>
                <p>
                  {t('study_matches', 'Matches')}: {matches}/{pairs.length}
                </p>
                <p>
                  {t('study_misses', 'Misses')}: {misses}
                </p>
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button onClick={() => resetGame()} variant="outline">
                  {t('study_play_again', 'Speel opnieuw')}
                </Button>
                {difficultyOptions.map((option) => (
                  <Button
                    key={option.id}
                    onClick={() => {
                      setDifficulty(option.id);
                      resetGame(option.id);
                    }}
                    variant={difficulty === option.id ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {difficultyOptions.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    onClick={() => setDifficulty(option.id)}
                    variant={difficulty === option.id ? 'secondary' : 'outline'}
                    size="sm"
                  >
                    {option.label}
                  </Button>
                ))}
                <Badge variant="secondary">
                  <Star className="w-3 h-3 mr-1" />
                  {score}
                </Badge>
                {combo > 1 && (
                  <Badge variant="default" className="bg-orange-500">
                    <Flame className="w-3 h-3 mr-1" />
                    {combo}x
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className={timeRemaining < 30 ? 'text-red-500 font-bold' : ''}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {matches}/{pairs.length}
                </div>
              </div>
            </div>
            {!started && (
              <p className="text-center py-2 text-sm text-muted-foreground">
                {t('study_match_hint', 'Klik een begrip en bijpassende definitie')}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-center">
                  {t('study_terms_column', 'Begrippen')}
                </h4>
                {terms.map((row) => (
                  <button
                    key={`t-${row.termId}`}
                    type="button"
                    disabled={row.matched}
                    onClick={() => {
                      if (!started) setStarted(true);
                      if (row.matched) return;
                      setSelectedTermId(row.termId);
                      setSelectedDefId(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      row.matched
                        ? 'border-green-500/50 bg-green-500/10 opacity-60'
                        : selectedTermId === row.termId
                          ? 'border-foreground bg-secondary'
                          : shake && selectedTermId === row.termId
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border bg-card hover:bg-secondary/50'
                    }`}
                  >
                    <MarkdownContent className="text-sm">{row.term}</MarkdownContent>
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-center">
                  {t('study_defs_column', 'Definities')}
                </h4>
                {defs.map((row) => (
                  <button
                    key={`d-${row.termId}`}
                    type="button"
                    disabled={row.matched}
                    onClick={() => {
                      if (!started) setStarted(true);
                      if (row.matched) return;
                      setSelectedDefId(row.termId);
                    }}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                      row.matched
                        ? 'border-green-500/50 bg-green-500/10 opacity-60'
                        : selectedDefId === row.termId
                          ? 'border-foreground bg-secondary'
                          : shake && selectedDefId === row.termId
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border bg-card hover:bg-secondary/50'
                    }`}
                  >
                    <MarkdownContent className="text-sm">{row.definition}</MarkdownContent>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
