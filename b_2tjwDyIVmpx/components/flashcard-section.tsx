'use client';

import { useState } from 'react';
import type { FlashcardSection as FlashcardSectionType } from '../lib/flashcard-data';

interface FlashcardSectionProps {
  section: FlashcardSectionType;
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

export function FlashcardSection({ section }: FlashcardSectionProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

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
    if (expandedQuestions.size === section.questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(section.questions.map((q) => q.id)));
    }
  };

  const allExpanded = expandedQuestions.size === section.questions.length;

  return (
    <div
      id={section.id}
      className="bg-card border border-border rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none scroll-mt-6"
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground font-mono tracking-wide">
              {section.timestamp}
            </p>
            <h2 className="text-[17px] font-serif text-foreground leading-snug font-normal">
              {section.title}
            </h2>
          </div>
          <button
            onClick={expandAll}
            className="text-[12px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      <div className="border-t border-border">
        {section.questions.map((question, index) => (
          <div key={question.id} className={index > 0 ? 'border-t border-border' : ''}>
            <button
              onClick={() => toggleQuestion(question.id)}
              className="w-full px-5 py-3 flex items-start gap-2.5 text-left hover:bg-secondary/50 transition-colors"
            >
              <ChevronIcon
                className="text-muted-foreground mt-[3px] flex-shrink-0"
                rotated={expandedQuestions.has(question.id)}
              />
              <span className="text-[13px] text-muted-foreground font-mono w-5 flex-shrink-0 mt-[1px]">
                {question.number}
              </span>
              <span className="text-[14px] text-foreground leading-[1.55]">{question.text}</span>
            </button>
            {expandedQuestions.has(question.id) && (
              <div className="px-5 pb-4 pl-[72px]">
                <div className="text-[13px] text-muted-foreground italic">
                  Answer not provided — use this as a self-test prompt.
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
