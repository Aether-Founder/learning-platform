"use client";

import { useCallback, useState } from "react";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import { getGameById, type GameShellProps } from "@/lib/learning-platform/game-registry";
import { getHighScore, saveHighScore, type GameScoreId } from "@/lib/learning-platform/game-scores";
import type { LearningMode } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";
import { Confetti } from "./ui/Confetti";

export function GameShell({
  gameId,
  onQuit,
  children,
}: {
  gameId: LearningMode;
  onQuit: () => void;
  children: (api: {
    reportScore: (score: number) => void;
    score: number;
    setScore: React.Dispatch<React.SetStateAction<number>>;
    isHighScore: boolean;
    showHighScoreLabel: boolean;
  }) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const studySetId = useLearningPlatformStore((s) => s.studySet?.id ?? "");
  const game = getGameById(gameId);
  const scoreId = (game?.scoreId ?? "blast") as GameScoreId;
  const lowerIsBetter = game?.lowerScoreIsBetter ?? false;

  const [score, setScore] = useState(0);
  const [showHighScoreLabel, setShowHighScoreLabel] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [isHighScore, setIsHighScore] = useState(false);

  const reportScore = useCallback(
    (value: number) => {
      setScore(value);
      const isNew = saveHighScore(studySetId, scoreId, value, lowerIsBetter);
      if (isNew) {
        setIsHighScore(true);
        setShowHighScoreLabel(true);
        setConfetti(true);
        setTimeout(() => setShowHighScoreLabel(false), 4000);
      }
    },
    [studySetId, scoreId, lowerIsBetter]
  );

  const best = getHighScore(studySetId, scoreId, lowerIsBetter);

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-4 shadow-sm">
      <Confetti active={confetti} />
      <div className="flex items-center justify-between gap-2 flex-wrap rounded-xl border border-border bg-background/70 px-3 py-2">
        <button
          type="button"
          onClick={onQuit}
          className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border border-border"
        >
          {t("study_quit_game", "Stop spel")}
        </button>
        <div className="flex gap-4 text-sm">
          <span className="font-medium text-foreground">
            {showHighScoreLabel
              ? t("study_highscore", "Highscore!")
              : t("study_score", "Score")}
            : {score}
          </span>
          {best !== null && (
            <span className="text-muted-foreground">
              {t("study_best", "Beste")}: {best}
              {lowerIsBetter ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      {children({ reportScore, score, setScore, isHighScore, showHighScoreLabel })}
    </div>
  );
}

/** Wrapper that mounts a registered game component with quit + highscore shell */
export function RegisteredGameView({
  gameId,
  onQuit,
}: {
  gameId: LearningMode;
  onQuit: () => void;
}) {
  const game = getGameById(gameId);
  if (!game) return null;
  const GameComponent = game.component;
  return <GameComponent onQuit={onQuit} />;
}
