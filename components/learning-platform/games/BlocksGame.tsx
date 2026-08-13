'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameShellProps } from '@/lib/learning-platform/game-registry';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import {
  buildMcqQuestion,
  buildWrittenQuestion,
  createId,
} from '@/lib/learning-platform/question-generator';
import type { BlockShape, Question } from '@/types/learning-platform';
import { useTranslation } from '@/lib/useTranslation';
import { McqQuestion } from '../questions/McqQuestion';
import { WrittenQuestion } from '../questions/WrittenQuestion';
import { GameShell } from '../GameShell';

const GRID = 8;
const CELL = 36;

const SHAPES: Omit<BlockShape, 'id'>[] = [
  {
    color: '#3b82f6',
    pattern: [
      [true, false],
      [true, true],
    ],
  },
  { color: '#22c55e', pattern: [[true, true, true, true]] },
  {
    color: '#eab308',
    pattern: [
      [true, true],
      [true, true],
    ],
  },
  { color: '#a855f7', pattern: [[true]] },
];

function emptyGrid() {
  return Array.from({ length: GRID }, () => Array(GRID).fill(null) as (string | null)[]);
}

function canPlace(grid: (string | null)[][], shape: boolean[][], row: number, col: number) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = row + r;
      const nc = col + c;
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID || grid[nr][nc]) return false;
    }
  }
  return true;
}

function placePreview(
  grid: (string | null)[][],
  shape: boolean[][],
  row: number,
  col: number,
  color: string
): (string | null)[][] {
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) next[row + r][col + c] = color;
    }
  }
  return next;
}

function placeFinal(
  grid: (string | null)[][],
  shape: boolean[][],
  row: number,
  col: number,
  color: string
) {
  const next = grid.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) next[row + r][col + c] = color;
    }
  }
  return next;
}

function clearFullLines(grid: (string | null)[][]) {
  const next = grid.map((row) => [...row]);
  let cleared = 0;
  for (let r = 0; r < GRID; r++) {
    if (next[r].every((cell) => cell)) {
      next[r] = Array(GRID).fill(null);
      cleared++;
    }
  }
  for (let c = 0; c < GRID; c++) {
    if (next.every((row) => row[c])) {
      for (let r = 0; r < GRID; r++) next[r][c] = null;
      cleared++;
    }
  }
  return { grid: next, cleared };
}

function freshBlocks(): BlockShape[] {
  return SHAPES.map((s) => ({ ...s, id: createId('block') }));
}

export function BlocksGame({ onQuit }: GameShellProps) {
  const { t } = useTranslation();
  const { playableTerms, studySet, settings, recordAnswer, beginSession } =
    useLearningPlatformStore();
  const [grid, setGrid] = useState(emptyGrid);
  const [blocks, setBlocks] = useState<BlockShape[]>(freshBlocks);
  const [dragBlock, setDragBlock] = useState<BlockShape | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [waiting, setWaiting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const lastQuestionTermId = useRef<string | null>(null);

  useEffect(() => {
    beginSession('blocks', playableTerms.length);
  }, [playableTerms, beginSession]);

  const requestQuestion = useCallback(() => {
    const terms = playableTerms;
    if (!terms.length) return;
    const pool =
      terms.length > 1 ? terms.filter((term) => term.id !== lastQuestionTermId.current) : terms;
    const term = pool[Math.floor(Math.random() * pool.length)];
    lastQuestionTermId.current = term.id;
    const all = studySet?.terms ?? terms;
    const q =
      Math.random() > 0.5
        ? buildMcqQuestion(term, all, settings)
        : buildWrittenQuestion(term, settings);
    setQuestion(q);
    setWaiting(true);
  }, [playableTerms, studySet, settings]);

  const onQuestionDone = (correct: boolean, answer: string) => {
    if (!question) return;
    recordAnswer(question.term.id, {
      questionType: question.type,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      isCorrect: correct,
      wasOverridden: false,
      timeSpent: 0,
    });
    setQuestion(null);
    setWaiting(false);
    if (correct) {
      setBlocks(freshBlocks());
    }
  };

  const skipQuestion = () => {
    if (!waiting) return;
    requestQuestion();
  };

  const previewGrid =
    dragBlock && hoverCell && canPlace(grid, dragBlock.pattern, hoverCell.row, hoverCell.col)
      ? placePreview(grid, dragBlock.pattern, hoverCell.row, hoverCell.col, `${dragBlock.color}66`)
      : grid;

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragBlock || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / (rect.width / GRID));
    const row = Math.floor((clientY - rect.top) / (rect.height / GRID));
    if (row >= 0 && row < GRID && col >= 0 && col < GRID) {
      setHoverCell({ row, col });
    } else {
      setHoverCell(null);
    }
  };

  const dropAt = (
    row: number,
    col: number,
    setScore: React.Dispatch<React.SetStateAction<number>>
  ) => {
    if (!dragBlock || waiting) return;
    if (!canPlace(grid, dragBlock.pattern, row, col)) return;
    const placed = placeFinal(grid, dragBlock.pattern, row, col, dragBlock.color);
    const { grid: cleared, cleared: lines } = clearFullLines(placed);
    setGrid(cleared);
    const points = lines * 10 + dragBlock.pattern.flat().filter(Boolean).length;
    scoreRef.current += points;
    setScore(scoreRef.current);
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== dragBlock.id);
      if (next.length === 0) setTimeout(() => requestQuestion(), 0);
      return next;
    });
    setDragBlock(null);
    setHoverCell(null);
  };

  return (
    <GameShell gameId="blocks" onQuit={onQuit}>
      {({ setScore }) => (
        <div className="space-y-4 select-none rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/40 p-5">
          <div
            ref={gridRef}
            className="relative mx-auto border border-border rounded-xl p-2 bg-background shadow-inner touch-none"
            style={{
              width: GRID * CELL,
              height: GRID * CELL,
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`,
              gridTemplateRows: `repeat(${GRID}, ${CELL}px)`,
              gap: 2,
            }}
            onPointerMove={(e) => {
              if (dragBlock) handlePointerMove(e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              if (dragBlock && hoverCell) {
                dropAt(hoverCell.row, hoverCell.col, setScore);
              }
              setDragBlock(null);
              setHoverCell(null);
            }}
            onPointerLeave={() => setHoverCell(null)}
          >
            {previewGrid.map((row, ri) =>
              row.map((cell, ci) => {
                const isPreview = dragBlock && hoverCell && cell === `${dragBlock.color}66`;
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className="rounded-sm border border-border/40"
                    style={{
                      backgroundColor: isPreview
                        ? dragBlock!.color + '99'
                        : cell && !String(cell).endsWith('66')
                          ? cell
                          : 'transparent',
                      boxShadow: isPreview ? `inset 0 0 0 2px ${dragBlock!.color}` : undefined,
                    }}
                  />
                );
              })
            )}
          </div>

          <div className="flex gap-3 flex-wrap justify-center items-end min-h-[80px]">
            {blocks.map((block) => (
              <div
                key={block.id}
                role="button"
                tabIndex={0}
                className={`p-2 rounded-lg border cursor-grab active:cursor-grabbing touch-none ${
                  dragBlock?.id === block.id
                    ? 'border-foreground ring-2 ring-foreground/20'
                    : 'border-border bg-card'
                }`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragBlock(block);
                }}
                onPointerMove={(e) => {
                  if (dragBlock?.id === block.id) handlePointerMove(e.clientX, e.clientY);
                }}
                onPointerUp={() => {
                  if (dragBlock?.id === block.id && hoverCell) {
                    dropAt(hoverCell.row, hoverCell.col, setScore);
                  }
                  setDragBlock(null);
                  setHoverCell(null);
                }}
              >
                <MiniGrid shape={block.pattern} color={block.color} />
              </div>
            ))}
          </div>

          {waiting && question && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <h3 className="font-medium mb-4 text-foreground">
                  {t('study_blocks_question', 'Beantwoord om nieuwe blokken te verdienen')}
                </h3>
                {question.type === 'multiple-choice' ? (
                  <McqQuestion question={question} onAnswer={(a, c) => onQuestionDone(c, a)} />
                ) : (
                  <WrittenQuestion
                    question={question}
                    smartGrading={settings.smartGrading}
                    retypeAnswers={false}
                    onComplete={(a, c) => onQuestionDone(c || false, a)}
                  />
                )}
                <button
                  type="button"
                  onClick={skipQuestion}
                  className="mt-4 w-full py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary"
                >
                  {t('study_skip_question', 'Sla over (andere vraag)')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}

function MiniGrid({ shape, color }: { shape: boolean[][]; color: string }) {
  return (
    <div
      className="inline-grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${shape[0]?.length ?? 1}, 14px)` }}
    >
      {shape.flatMap((row, ri) =>
        row.map((cell, ci) => (
          <span
            key={`${ri}-${ci}`}
            className="w-3.5 h-3.5 rounded-sm"
            style={{ backgroundColor: cell ? color : 'transparent' }}
          />
        ))
      )}
    </div>
  );
}
