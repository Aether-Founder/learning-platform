'use client';

import type { ComponentType } from 'react';
import { BookOpen, Gamepad2, Keyboard, Rocket, Sparkles } from 'lucide-react';
import type { LearningMode } from '@/types/learning-platform';
import type { GameScoreId } from './game-scores';
import { MatchGame } from '@/components/learning-platform/games/MatchGame';
import { BlastGame } from '@/components/learning-platform/games/BlastGame';
import { BlocksGame } from '@/components/learning-platform/games/BlocksGame';
import { QuizSprintGame } from '@/components/learning-platform/games/QuizSprintGame';
import { TypeRushGame } from '@/components/learning-platform/games/TypeRushGame';

export interface GameShellProps {
  onQuit: () => void;
}

export interface StudyGameDefinition {
  id: LearningMode;
  scoreId: GameScoreId;
  labelKey: string;
  fallback: string;
  icon: ComponentType<{ className?: string }>;
  /** If true, lower score (e.g. seconds) is better */
  lowerScoreIsBetter?: boolean;
  component: ComponentType<GameShellProps>;
}

/**
 * Register new games here — one entry adds a button in Spelletjes and wires the component.
 *
 * To add a game:
 * 1. Create `components/learning-platform/games/YourGame.tsx` exporting `function YourGame({ onQuit }: GameShellProps)`
 * 2. Import it below and append to STUDY_GAMES with id, scoreId, labelKey, fallback, icon, and component
 * 3. Add scoreId to GameScoreId in `lib/learning-platform/game-scores.ts` if needed
 */
export const STUDY_GAMES: StudyGameDefinition[] = [
  {
    id: 'match',
    scoreId: 'match',
    labelKey: 'study_game_match',
    fallback: 'Koppelspel',
    icon: Gamepad2,
    lowerScoreIsBetter: true,
    component: MatchGame,
  },
  {
    id: 'blast',
    scoreId: 'blast',
    labelKey: 'study_game_blast',
    fallback: 'Blast',
    icon: Sparkles,
    component: BlastGame,
  },
  {
    id: 'blocks',
    scoreId: 'blocks',
    labelKey: 'study_game_blocks',
    fallback: 'Blokken',
    icon: BookOpen,
    component: BlocksGame,
  },
  {
    id: 'sprint',
    scoreId: 'sprint',
    labelKey: 'study_game_sprint',
    fallback: 'Quiz sprint',
    icon: Rocket,
    component: QuizSprintGame,
  },
  {
    id: 'type-rush',
    scoreId: 'type-rush',
    labelKey: 'study_game_type_rush',
    fallback: 'Type rush',
    icon: Keyboard,
    component: TypeRushGame,
  },
];

export function getGameById(id: LearningMode): StudyGameDefinition | undefined {
  return STUDY_GAMES.find((g) => g.id === id);
}
