'use client';

import { useState, memo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTranslation } from '@/lib/i18n';

function processNewlines(text: string): string {
  return text.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').replace(/\n/g, '  \n');
}

interface SubSection {
  id: string;
  title: string;
  questions: Array<{
    id: string;
    number: string;
    text: string;
    answer?: string;
  }>;
}

interface NestedSectionProps {
  section: {
    id: string;
    title: string;
    timestamp?: string;
    subSections?: SubSection[];
    questions?: Array<{
      id: string;
      number: string;
      text: string;
      answer?: string;
    }>;
  };
  showTimestamps: boolean;
}

function ChevronIcon({ className, rotated }: { className?: string; rotated?: boolean }) {
  return (
    <svg
      className={`${className} transition-transform duration-150 ${rotated ? 'rotate-90' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export const NestedSection = memo(function NestedSection({
  section,
  showTimestamps,
}: NestedSectionProps) {
  const { t } = useTranslation();
  const [expandedSubSections, setExpandedSubSections] = useState<Set<string>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleSubSection = (subSectionId: string) => {
    setExpandedSubSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subSectionId)) {
        newSet.delete(subSectionId);
      } else {
        newSet.add(subSectionId);
      }
      return newSet;
    });
  };

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

  const expandAll = () => {
    const allSubSectionIds = section.subSections?.map((s) => s.id) || [];
    const allQuestionIds = section.questions?.map((q) => q.id) || [];

    if (
      expandedSubSections.size === allSubSectionIds.length &&
      expandedQuestions.size === allQuestionIds.length
    ) {
      setExpandedSubSections(new Set());
      setExpandedQuestions(new Set());
    } else {
      setExpandedSubSections(new Set(allSubSectionIds));
      setExpandedQuestions(new Set(allQuestionIds));
    }
  };

  const allExpanded =
    (section.subSections?.length === expandedSubSections.size || !section.subSections) &&
    (section.questions?.length === expandedQuestions.size || !section.questions);

  return (
    <div
      id={section.id}
      className="bg-card border border-border rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none scroll-mt-6"
    >
      <div className="px-4 sm:px-5 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            {showTimestamps && (
              <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
                {section.timestamp}
              </p>
            )}
            <h2 className="text-[24px] sm:text-[30px] font-serif text-foreground leading-snug font-normal">
              {section.title}
            </h2>
          </div>
          <button
            onClick={expandAll}
            className="text-[11px] sm:text-[12px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap mt-2 sm:mt-0"
          >
            {allExpanded ? t('collapse_all') : t('expand_all')}
          </button>
        </div>
      </div>

      <div className="border-t border-border">
        {/* Render Subsections */}
        {section.subSections?.map((subSection: SubSection, index: number) => (
          <div key={subSection.id} className={index > 0 ? 'border-t border-border' : ''}>
            <button
              onClick={() => toggleSubSection(subSection.id)}
              className="w-full px-3 sm:px-5 py-2 flex items-start gap-2 sm:gap-2.5 text-left hover:bg-secondary transition-colors"
            >
              <ChevronIcon
                className="text-muted-foreground mt-[3px] flex-shrink-0"
                rotated={expandedSubSections.has(subSection.id)}
              />
              <div className="flex-1">
                <h3 className="text-[14px] sm:text-[15px] font-medium text-foreground leading-[1.55]">
                  {subSection.title}
                </h3>
              </div>
            </button>

            {expandedSubSections.has(subSection.id) && (
              <div className="border-t border-border">
                {subSection.questions.map(
                  (
                    question: { id: string; number: string; text: string; answer?: string },
                    qIndex: number
                  ) => (
                    <div key={question.id} className={qIndex > 0 ? 'border-t border-border' : ''}>
                      <button
                        onClick={() => toggleQuestion(question.id)}
                        className="w-full px-3 sm:px-5 py-2 flex items-start gap-2 sm:gap-2.5 text-left"
                      >
                        <ChevronIcon
                          className="text-muted-foreground mt-[3px] flex-shrink-0"
                          rotated={expandedQuestions.has(question.id)}
                        />
                        <span className="text-[12px] sm:text-[13px] text-muted-foreground font-mono w-5 flex-shrink-0 mt-[1px]">
                          {question.number}
                        </span>
                        <MarkdownRenderer className="text-[13px] sm:text-[14px] text-foreground leading-[1.55]">
                          {processNewlines(question.text)}
                        </MarkdownRenderer>
                      </button>
                      {expandedQuestions.has(question.id) && (
                        <div className="px-5 pb-4 pl-[72px]">
                          {question.answer ? (
                            <MarkdownRenderer className="text-[12px] sm:text-[13px] text-muted-foreground">
                              {processNewlines(question.answer)}
                            </MarkdownRenderer>
                          ) : (
                            <div className="text-[12px] sm:text-[13px] text-muted-foreground italic">
                              {t('answer_not_provided_hint')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        {/* Render Direct Questions (if no subsections) */}
        {!section.subSections &&
          section.questions?.map(
            (
              question: { id: string; number: string; text: string; answer?: string },
              index: number
            ) => (
              <div key={question.id} className={index > 0 ? 'border-t border-border' : ''}>
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full px-3 sm:px-5 py-2 flex items-start gap-2 sm:gap-2.5 text-left"
                >
                  <ChevronIcon
                    className="text-muted-foreground mt-[3px] flex-shrink-0"
                    rotated={expandedQuestions.has(question.id)}
                  />
                  <span className="text-[12px] sm:text-[13px] text-muted-foreground font-mono w-5 flex-shrink-0 mt-[1px]">
                    {question.number}
                  </span>
                  <MarkdownRenderer className="text-[13px] sm:text-[14px] text-foreground leading-[1.55]">
                    {processNewlines(question.text)}
                  </MarkdownRenderer>
                </button>
                {expandedQuestions.has(question.id) && (
                  <div className="px-5 pb-4 pl-[72px]">
                    {question.answer ? (
                      <MarkdownRenderer className="text-[12px] sm:text-[13px] text-muted-foreground">
                        {processNewlines(question.answer)}
                      </MarkdownRenderer>
                    ) : (
                      <div className="text-[12px] sm:text-[13px] text-muted-foreground italic">
                        {t('answer_not_provided_hint')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
      </div>
    </div>
  );
});
