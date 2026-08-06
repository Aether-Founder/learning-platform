"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Clock, Target, Star, ArrowLeft, ArrowRight } from "lucide-react";
import type { GameShellProps } from "@/lib/learning-platform/game-registry";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { useTranslation } from "@/lib/i18n";
import { MarkdownContent } from "../shared/MarkdownContent";
import { GameShell } from "../GameShell";

interface FallingItem {
  id: string;
  term: string;
  definition: string;
  x: number;
  y: number;
  speed: number;
  matched: boolean;
}

export function GravityGame({ onQuit }: GameShellProps) {
  const { t } = useTranslation();
  const { playableTerms, recordAnswer, beginSession, endSession } = useLearningPlatformStore();
  const [items, setItems] = useState<FallingItem[]>([]);
  const [currentDefinition, setCurrentDefinition] = useState<string>("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const playerXRef = useRef(50);
  const reportRef = useRef<(n: number) => void>(() => {});
  const reportedRef = useRef(false);
  const animationRef = useRef<number>();

  const difficultyConfigs = {
    easy: { speed: 1, spawnRate: 2000, maxItems: 3 },
    medium: { speed: 1.5, spawnRate: 1500, maxItems: 5 },
    hard: { speed: 2, spawnRate: 1000, maxItems: 7 },
  };

  useEffect(() => {
    if (gameOver && !reportedRef.current) {
      reportedRef.current = true;
      reportRef.current(score);
      endSession();
    }
  }, [gameOver, score, endSession]);

  useEffect(() => {
    if (timeRemaining <= 0 && started && !gameOver) {
      setGameOver(true);
    }
  }, [timeRemaining, started, gameOver]);

  useEffect(() => {
    if (!started || gameOver) return;
    const timer = setInterval(() => setTimeRemaining((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, gameOver]);

  const spawnItem = useCallback(() => {
    if (!started || gameOver || items.length >= difficultyConfigs[difficulty].maxItems) return;

    const availableTerms = playableTerms.filter(
      (term) => !items.some((item) => item.term === term.term)
    );

    if (availableTerms.length === 0) return;

    const randomTerm = availableTerms[Math.floor(Math.random() * availableTerms.length)];
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const newItem: FallingItem = {
      id: randomTerm.id,
      term: randomTerm.term,
      definition: randomTerm.definition,
      x: Math.random() * 80 + 10,
      y: -50,
      speed: difficultyConfigs[difficulty].speed,
      matched: false,
    };

    setItems((prev) => [...prev, newItem]);
  }, [started, gameOver, items, playableTerms, difficulty]);

  useEffect(() => {
    if (!started || gameOver) return;

    const spawnInterval = setInterval(spawnItem, difficultyConfigs[difficulty].spawnRate);
    return () => clearInterval(spawnInterval);
  }, [started, gameOver, spawnItem, difficulty]);

  const updateItems = useCallback(() => {
    if (!started || gameOver) return;

    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.matched) return item;
        const newY = item.y + item.speed;
        if (newY > 100) {
          setLives((l) => l - 1);
          setCombo(0);
          if (lives - 1 <= 0) {
            setGameOver(true);
          }
          return { ...item, y: -50, x: Math.random() * 80 + 10 };
        }
        return { ...item, y: newY };
      });
    });
  }, [started, gameOver, lives]);

  useEffect(() => {
    if (!started || gameOver) return;
    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [started, gameOver, updateItems]);

  const gameLoop = () => {
    updateItems();
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const handleMatch = (item: FallingItem) => {
    if (item.definition === currentDefinition) {
      const comboMultiplier = Math.max(1, combo + 1);
      const points = 10 * comboMultiplier;
      setScore((s) => s + points);
      setCombo((c) => c + 1);
      setMaxCombo((m) => Math.max(m, combo + 1));

      recordAnswer(item.id, {
        questionType: "flashcard",
        userAnswer: item.term,
        correctAnswer: item.definition,
        isCorrect: true,
        wasOverridden: false,
        timeSpent: 0,
      });

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setCurrentDefinition("");
    } else {
      setCombo(0);
      setLives((l) => l - 1);
      if (lives - 1 <= 0) {
        setGameOver(true);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!started || gameOver) return;

    const moveAmount = 5;
    switch (e.key) {
      case "ArrowLeft":
        playerXRef.current = Math.max(0, playerXRef.current - moveAmount);
        break;
      case "ArrowRight":
        playerXRef.current = Math.min(100, playerXRef.current + moveAmount);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [started, gameOver]);

  const resetGame = () => {
    setStarted(false);
    setGameOver(false);
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setTimeRemaining(60);
    setItems([]);
    setCurrentDefinition("");
    playerXRef.current = 50;
    reportedRef.current = false;

    const config = difficultyConfigs[difficulty];
    beginSession("gravity", config.maxItems);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GameShell gameId="gravity" onQuit={onQuit}>
      {({ reportScore }) => {
        reportRef.current = reportScore;

        if (gameOver) {
          return (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center gap-2">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-serif">
                  {lives <= 0 ? t("study_game_over", "Spel voorbij!") : t("study_time_up", "Tijd om!")}
                </h3>
              </div>
              <div className="flex justify-center gap-4">
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
                <p>{t("study_time", "Tijd")}: {formatTime(60 - timeRemaining)}</p>
                <p>{t("study_score", "Score")}: {score}</p>
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={resetGame} variant="outline">
                  {t("study_play_again", "Speel opnieuw")}
                </Button>
                <Button onClick={() => setDifficulty("easy")} variant="ghost" size="sm">
                  {t("study_difficulty_easy", "Makkelijk")}
                </Button>
                <Button onClick={() => setDifficulty("medium")} variant="ghost" size="sm">
                  {t("study_difficulty_medium", "Middel")}
                </Button>
                <Button onClick={() => setDifficulty("hard")} variant="ghost" size="sm">
                  {t("study_difficulty_hard", "Moeilijk")}
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                <Badge variant={lives <= 1 ? "destructive" : "secondary"}>
                  <Target className="w-3 h-3 mr-1" />
                  {lives} levens
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="w-4 h-4" />
                  <span className={timeRemaining < 10 ? "text-red-500 font-bold" : ""}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {!started && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {t("study_gravity_hint", "Vang de vallende termen die bij de definitie passen")}
                </p>
                <Button onClick={resetGame} size="lg">
                  {t("study_start_game", "Start Spel")}
                </Button>
              </div>
            )}

            {started && (
              <>
                <div className="text-center py-3 px-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">{t("study_match_definition", "Match de definitie")}:</p>
                  <p className="text-lg font-semibold">
                    {currentDefinition || t("study_waiting", "Wachten op item...")}
                  </p>
                </div>

                <div
                  ref={gameAreaRef}
                  className="relative h-96 bg-gradient-to-b from-sky-100 to-sky-200 rounded-lg overflow-hidden"
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentDefinition(item.definition);
                        handleMatch(item);
                      }}
                      className={`absolute cursor-pointer transition-all ${
                        item.matched ? "opacity-0" : "opacity-100"
                      }`}
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div className="bg-white p-3 rounded-lg shadow-md border-2 border-blue-500">
                        <MarkdownContent className="text-sm font-medium">{item.term}</MarkdownContent>
                      </div>
                    </div>
                  ))}

                  <div
                    className="absolute bottom-0 w-16 h-4 bg-blue-600 rounded-t-lg"
                    style={{
                      left: `${playerXRef.current}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>

                <div className="flex justify-center gap-2">
                  <Button
                    onClick={() => playerXRef.current = Math.max(0, playerXRef.current - 10)}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => playerXRef.current = Math.min(100, playerXRef.current + 10)}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
