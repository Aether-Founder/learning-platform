'use client';

import { useMemo, memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Hash } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { getSectionTitle, getSectionTitles } from '@/lib/section-title';

// Helper function to convert \n to actual newlines
function processNewlines(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

interface ParagraphQuestion {
  id: string;
  number: string;
  question: string;
  answer: string;
}

interface Paragraph {
  id: string;
  title?: string;
  content: string;
  questions: ParagraphQuestion[];
}

interface SimpleModeProps {
  section: {
    id: string;
    title: string | string[];
    titles?: string[];
    chapterTitles?: string[];
    paragraphs?: Paragraph[];
  };
}

const SectionHeader = memo(function SectionHeader({
  titles,
  id,
}: {
  titles: string[];
  id: string;
}) {
  const [mainTitle, ...extraTitles] = titles;

  return (
    <div id={id} className="mb-8 scroll-mt-24">
      <h2 className="text-3xl sm:text-4xl font-serif font-medium text-foreground leading-tight mb-4">
        <span className="block">{mainTitle}</span>
        {extraTitles.map((title) => (
          <span key={title} className="mt-1 block text-2xl sm:text-3xl text-muted-foreground">
            {title}
          </span>
        ))}
      </h2>
      <div className="h-px bg-border w-full" />
    </div>
  );
});

const ParagraphContent = memo(function ParagraphContent({
  paragraph,
}: {
  paragraph: Paragraph;
  sectionIndex: number;
  paraIndex: number;
}) {
  const { t } = useTranslation();
  const anchorId = `${paragraph.id}`;

  return (
    <div id={anchorId} className="mb-10 scroll-mt-20">
      {/* Paragraph Title with Anchor */}
      {paragraph.title && (
        <div className="group flex items-center gap-3 mb-4">
          <h3 className="text-xl sm:text-2xl font-serif font-medium text-foreground">
            {paragraph.title}
          </h3>
          <a
            href={`#${anchorId}`}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            title={t('link_to_paragraph')}
          >
            <Hash className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Main Content */}
      <div className="prose prose-lg max-w-none">
        <MarkdownRenderer className="text-[17px] leading-[1.7] text-foreground">
          {processNewlines(paragraph.content)}
        </MarkdownRenderer>
      </div>

      {/* Questions & Answers (inline) */}
      {paragraph.questions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {t('questions_and_answers')}
          </h4>
          <div className="space-y-4">
            {paragraph.questions.map((q) => (
              <div key={q.id} className="bg-secondary/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                    {q.number}
                  </span>
                  <div className="flex-1">
                    <p className="text-foreground font-medium mb-2">{q.question}</p>
                    <div className="text-muted-foreground text-sm leading-relaxed">
                      <MarkdownRenderer>{processNewlines(q.answer)}</MarkdownRenderer>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const SimpleMode = memo(function SimpleMode({ section }: SimpleModeProps) {
  const { t } = useTranslation();
  const paragraphs = useMemo(() => section.paragraphs || [], [section.paragraphs]);
  const sectionTitles = getSectionTitles(section);

  if (paragraphs.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('empty_state_empty')}</div>;
  }

  return (
    <article className="max-w-3xl mx-auto">
      <SectionHeader
        titles={sectionTitles.length ? sectionTitles : [getSectionTitle(section)]}
        id={section.id}
      />

      <div className="space-y-8">
        {paragraphs.map((paragraph, idx) => (
          <ParagraphContent
            key={paragraph.id}
            paragraph={paragraph}
            sectionIndex={0}
            paraIndex={idx}
          />
        ))}
      </div>
    </article>
  );
});
