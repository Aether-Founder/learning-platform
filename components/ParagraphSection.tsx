'use client';

import { useState, useMemo, memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChevronDown, HelpCircle, Bookmark } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface ParagraphQuestion {
  id: string;
  number: string;
  question: string;
  answer: string;
  type: 'inline' | 'section';
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Paragraph {
  id: string;
  title?: string;
  content: string;
  questions: ParagraphQuestion[];
}

interface ParagraphSectionProps {
  section: {
    id: string;
    title: string;
    paragraphs?: Paragraph[];
  };
  showTimestamps: boolean;
  bookmarks?: Set<string>;
  onToggleBookmark?: (paragraphId: string, title: string) => void;
}

// Helper function to convert \n to actual newlines and preserve markdown breaks
function processNewlines(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

const InlineQuestionAccordion = memo(function InlineQuestionAccordion({
  question,
  isExpanded,
  onToggle,
}: {
  question: ParagraphQuestion;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="border border-border rounded-md overflow-hidden bg-secondary/30">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {question.number}: {processNewlines(question.question)}
          </span>
          {question.difficulty && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                question.difficulty === 'easy'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : question.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {t(`difficulty_${question.difficulty}`, question.difficulty)}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 py-3 border-t border-border bg-background">
          <MarkdownRenderer className="text-sm text-muted-foreground leading-relaxed">
            {processNewlines(question.answer)}
          </MarkdownRenderer>
        </div>
      )}
    </div>
  );
});

const ParagraphCard = memo(function ParagraphCard({
  paragraph,
  expandedQuestions,
  onToggleQuestion,
  isBookmarked,
  onToggleBookmark,
}: {
  paragraph: Paragraph;
  expandedQuestions: Set<string>;
  onToggleQuestion: (questionId: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <article
      id={paragraph.id}
      className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm scroll-mt-24"
    >
      {/* Paragraph Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        {paragraph.title && (
          <h3 className="text-xl font-serif font-medium text-foreground leading-tight">
            {paragraph.title}
          </h3>
        )}
        {onToggleBookmark && (
          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-md transition-colors ${
              isBookmarked
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title={isBookmarked ? t('remove_bookmark') : t('bookmark_this')}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Paragraph Content */}
      <div className="prose prose-sm max-w-none mb-6">
        <MarkdownRenderer className="text-[17px] leading-[1.7] text-foreground">
          {processNewlines(paragraph.content)}
        </MarkdownRenderer>
      </div>

      {/* Inline Questions */}
      {paragraph.questions.length > 0 && (
        <div className="space-y-3 mt-8 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {t('questions')} ({paragraph.questions.length})
          </h4>
          {paragraph.questions.map((question) => (
            <InlineQuestionAccordion
              key={question.id}
              question={question}
              isExpanded={expandedQuestions.has(question.id)}
              onToggle={() => onToggleQuestion(question.id)}
            />
          ))}
        </div>
      )}
    </article>
  );
});

export const ParagraphSection = memo(function ParagraphSection({
  section,
  bookmarks,
  onToggleBookmark,
}: ParagraphSectionProps) {
  const { t } = useTranslation();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const paragraphs = useMemo(() => section.paragraphs || [], [section.paragraphs]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const expandAllQuestions = () => {
    const allQuestionIds = paragraphs.flatMap((p) => p.questions.map((q) => q.id));
    setExpandedQuestions(new Set(allQuestionIds));
  };

  const collapseAllQuestions = () => {
    setExpandedQuestions(new Set());
  };

  if (paragraphs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t('no_paragraphs_available')}</div>
    );
  }

  return (
    <section id={section.id} className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <h2 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">
          {section.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAllQuestions}
            className="text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {t('expand_all_qa')}
          </button>
          <button
            onClick={collapseAllQuestions}
            className="text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {t('collapse_all')}
          </button>
        </div>
      </div>

      {/* Paragraphs */}
      <div className="space-y-8">
        {paragraphs.map((paragraph) => (
          <ParagraphCard
            key={paragraph.id}
            paragraph={paragraph}
            expandedQuestions={expandedQuestions}
            onToggleQuestion={toggleQuestion}
            isBookmarked={bookmarks?.has(paragraph.id)}
            onToggleBookmark={
              onToggleBookmark
                ? () => onToggleBookmark(paragraph.id, paragraph.title || 'Untitled')
                : undefined
            }
          />
        ))}
      </div>
    </section>
  );
});
