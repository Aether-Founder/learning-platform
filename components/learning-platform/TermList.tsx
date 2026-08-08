'use client';

import { EyeOff, Moon, Star } from 'lucide-react';
import type { Term } from '@/types/learning-platform';
import { useLearningPlatformStore } from '@/store/useLearningPlatformStore';
import { MarkdownContent } from './shared/MarkdownContent';

function StatusIcon({ status }: { status: Term['masteryStatus'] }) {
  const colors = {
    unstudied: 'bg-muted-foreground/30',
    learning: 'bg-yellow-500',
    review: 'bg-sky-500',
    due: 'bg-orange-500',
    mastered: 'bg-green-600',
    suspended: 'bg-slate-500',
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${colors[status]}`}
      title={status}
    />
  );
}

export function TermList({ terms }: { terms: Term[] }) {
  const toggleStar = useLearningPlatformStore((s) => s.toggleStar);
  const suspendTerm = useLearningPlatformStore((s) => s.suspendTerm);
  const buryTerm = useLearningPlatformStore((s) => s.buryTerm);

  return (
    <ul className="space-y-3">
      {terms.map((term) => (
        <li
          key={term.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 hover:bg-secondary/30"
        >
          <span className="pt-1">
            <StatusIcon status={term.masteryStatus} />
          </span>
          <div className="flex-1 min-w-0 space-y-2">
            <MarkdownContent className="text-base font-medium">{term.term}</MarkdownContent>
            <MarkdownContent className="text-sm leading-relaxed text-muted-foreground">
              {term.definition}
            </MarkdownContent>
            {term.learningSetTitle && (
              <p className="text-xs text-muted-foreground">{term.learningSetTitle}</p>
            )}
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span>{term.cardType || 'basic'}</span>
              {(term.tags || []).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
              {term.nextReviewAt && <span>Review: {term.nextReviewAt.toLocaleDateString()}</span>}
              {typeof term.intervalDays === 'number' && (
                <span>{Math.round(term.intervalDays * 10) / 10}d</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => buryTerm(term.id)}
            className="p-1 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Bury until tomorrow"
            title="Bury until tomorrow"
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => suspendTerm(term.id)}
            className="p-1 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={term.suspended ? 'Unsuspend' : 'Suspend'}
            title={term.suspended ? 'Unsuspend' : 'Suspend'}
          >
            <EyeOff className={`h-4 w-4 ${term.suspended ? 'text-slate-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => toggleStar(term.id)}
            className="p-1 shrink-0 text-muted-foreground hover:text-yellow-500"
            aria-label={term.isStarred ? 'Unstar' : 'Star'}
          >
            <Star
              className={`h-4 w-4 ${term.isStarred ? 'fill-yellow-500 text-yellow-500' : ''}`}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
