'use client';

import { MarkdownRenderer } from './MarkdownRenderer';

interface SummaryModeProps {
  summary?: string;
}

export function SummaryMode({ summary }: SummaryModeProps) {
  if (!summary) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Geen samenvatting beschikbaar.</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <MarkdownRenderer className="text-[17px] leading-[1.75] text-foreground">
          {summary}
        </MarkdownRenderer>
      </div>
    </article>
  );
}
