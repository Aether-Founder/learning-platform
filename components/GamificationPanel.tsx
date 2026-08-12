'use client';

import { useMemo, useState } from 'react';
import { Flame, Sparkles, Star, Trophy } from 'lucide-react';
import {
  awardXp,
  DEFAULT_GAMIFICATION_STATS,
  getXpReward,
  xpProgress,
  type GamificationStats,
} from '@/lib/gamification/stats';

export function GamificationPanel({
  initialStats = DEFAULT_GAMIFICATION_STATS,
}: {
  initialStats?: GamificationStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const progress = useMemo(() => xpProgress(stats), [stats]);

  const reviewCard = () => setStats((current) => awardXp(current, 'review_card'));

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Jouw ritme</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Kleine stappen, grote voorsprong</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Verdien XP met elke review en bouw een leergewoonte die blijft hangen.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold">
          <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          Level {progress.level}
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ervaring</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{stats.xp} XP</p>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {progress.current} / {progress.required} naar level {progress.level + 1}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress.percentage}%` }} />
          </div>
          <button
            type="button"
            onClick={reviewCard}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Review een kaart (+{getXpReward('review_card')} XP)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-4">
            <Flame className="h-4 w-4 text-warning" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{stats.currentStreak}</p>
            <p className="text-xs text-muted-foreground">dagen streak</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <Star className="h-4 w-4 text-warning" aria-hidden="true" />
            <p className="mt-3 text-2xl font-semibold tabular-nums">{stats.cardsReviewed}</p>
            <p className="text-xs text-muted-foreground">kaarten herhaald</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold">Badges</h3>
          <span className="text-xs text-muted-foreground">{stats.badges.length} verzameld</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.badges.map((badge) => (
            <span key={badge} className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium">
              ✦ {badge.replaceAll('-', ' ')}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
