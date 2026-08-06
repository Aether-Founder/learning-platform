"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evaluateAnswer } from "@/lib/learning-platform/grading";
import { getPromptAndAnswer } from "@/lib/learning-platform/term-filters";
import type { GameShellProps } from "@/lib/learning-platform/game-registry";
import { useLearningPlatformStore } from "@/store/useLearningPlatformStore";
import type { FallingItem } from "@/types/learning-platform";
import { createId } from "@/lib/learning-platform/question-generator";
import { useTranslation } from "@/lib/i18n";
import { GameShell } from "../GameShell";

function getCanvasTextColor() {
  if (typeof document === "undefined") return "#1a1a1a";
  return document.documentElement.classList.contains("dark") ? "#f4f4f5" : "#18181b";
}

export function BlastGame({ onQuit }: GameShellProps) {
  const { t } = useTranslation();
  const { playableTerms, settings, recordAnswer, beginSession, endSession } =
    useLearningPlatformStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [input, setInput] = useState("");
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const speedRef = useRef(1);
  const scoreRef = useRef(0);
  const reportRef = useRef<(n: number) => void>(() => {});
  const reportedRef = useRef(false);
  const termsRef = useRef(playableTerms);
  const itemsRef = useRef<FallingItem[]>([]);
  termsRef.current = playableTerms;
  itemsRef.current = items;

  useEffect(() => {
    beginSession("blast", playableTerms.length);
  }, [playableTerms, beginSession]);

  useEffect(() => {
    if (gameOver && !reportedRef.current) {
      reportedRef.current = true;
      reportRef.current(scoreRef.current);
      endSession();
    }
  }, [gameOver, endSession]);

  const spawn = useCallback(() => {
    const terms = termsRef.current;
    if (!terms.length) return;
    const activeIds = new Set(itemsRef.current.map((item) => item.term.id));
    const pool = terms.filter((term) => !activeIds.has(term.id));
    const term = (pool.length ? pool : terms)[Math.floor(Math.random() * (pool.length || terms.length))];
    const { prompt, answer } = getPromptAndAnswer(term, settings.questionFormat);
    setItems((prev) => [
      ...prev,
      {
        id: createId("fall"),
        term,
        content: prompt.slice(0, 120),
        correctAnswer: answer,
        yPosition: 0,
        xPosition: 15 + Math.random() * 70,
        speed: 0.35 + speedRef.current * 0.08,
      },
    ]);
  }, [settings.questionFormat]);

  useEffect(() => {
    if (gameOver) return;
    const spawnInterval = setInterval(spawn, 2200);
    return () => clearInterval(spawnInterval);
  }, [gameOver, spawn]);

  useEffect(() => {
    if (gameOver) return;
    let frame: number;
    const loop = () => {
      setItems((prev) => {
        const next: FallingItem[] = [];
        let lostLife = false;
        prev.forEach((item) => {
          const y = item.yPosition + item.speed;
          if (y >= 92) lostLife = true;
          else next.push({ ...item, yPosition: y });
        });
        if (lostLife) {
          setLives((l) => {
            const n = l - 1;
            if (n <= 0) setGameOver(true);
            return n;
          });
        }
        return next;
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = getCanvasTextColor();
    ctx.font = "600 15px var(--font-inter), system-ui, sans-serif";
    items.forEach((item) => {
      const x = (item.xPosition / 100) * w;
      const y = (item.yPosition / 100) * h;
      const lines = item.content.match(/.{1,42}/g) ?? [item.content];
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * 18);
      });
    });
  }, [items]);

  const submit = (
    e: React.FormEvent,
    setScore: React.Dispatch<React.SetStateAction<number>>
  ) => {
    e.preventDefault();
    if (!input.trim() || gameOver) return;
    const match = items.find((item) => {
      const g = evaluateAnswer(input, item.correctAnswer, settings.smartGrading);
      return g.isCorrect;
    });
    if (match) {
      setItems((prev) => prev.filter((i) => i.id !== match.id));
      scoreRef.current += 1;
      setScore(scoreRef.current);
      speedRef.current = 1 + Math.floor(scoreRef.current / 5) * 0.15;
      recordAnswer(match.term.id, {
        questionType: "written",
        userAnswer: input,
        correctAnswer: match.correctAnswer,
        isCorrect: true,
        wasOverridden: false,
        timeSpent: 0,
      });
    }
    setInput("");
  };

  return (
    <GameShell gameId="blast" onQuit={onQuit}>
      {({ reportScore, setScore }) => {
        reportRef.current = reportScore;

        if (gameOver) {
          return (
            <div className="text-center py-12">
              <h3 className="text-xl font-serif">Game over</h3>
              <p className="text-muted-foreground">
                Score: {scoreRef.current}
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
            <div className="flex justify-end text-sm text-muted-foreground">
              <span>
                {t("study_lives", "Levens")}: {lives}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-72 rounded-xl border border-border bg-background shadow-inner"
            />
            <p className="text-xs text-center text-muted-foreground">
              {t(
                "study_blast_hint",
                "Typ het begrip dat bij de vallende definitie hoort"
              )}
            </p>
            <form onSubmit={(e) => submit(e, setScore)}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-3 bg-background text-foreground"
                placeholder={t("study_type_answer", "Typ je antwoord…")}
                autoFocus
              />
            </form>
          </div>
        );
      }}
    </GameShell>
  );
}
