"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Question } from "@/types/learning-platform";
import { MarkdownContent } from "../shared/MarkdownContent";

interface McqQuestionProps {
  question: Question;
  onAnswer: (selected: string, isCorrect: boolean) => void;
  disabled?: boolean;
  showFeedback?: boolean;
}

export function McqQuestion({
  question,
  onAnswer,
  disabled,
  showFeedback = true,
}: McqQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (submitted || disabled) return;
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    setSubmitted(true);
    onAnswer(option, isCorrect);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 min-h-[120px] flex items-center justify-center">
        <MarkdownContent className="text-lg text-center font-medium">
          {question.prompt}
        </MarkdownContent>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {(question.options || []).map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === question.correctAnswer;
          let style = "border-border bg-card hover:bg-secondary/80";
          if (submitted && showFeedback) {
            if (isCorrect) style = "border-green-500 bg-green-500/15";
            else if (isSelected) style = "border-red-500 bg-red-500/15";
            else style = "border-border opacity-60";
          } else if (isSelected) {
            style = "border-foreground bg-secondary";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={submitted || disabled}
              onClick={() => handleSelect(option)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-all duration-200 ${style}`}
            >
              <span className="flex items-start gap-2">
                {submitted && showFeedback && isCorrect && (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                )}
                {submitted && showFeedback && isSelected && !isCorrect && (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                )}
                <MarkdownContent className="text-sm">{option}</MarkdownContent>
              </span>
            </button>
          );
        })}
      </div>
      {submitted && showFeedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            selected === question.correctAnswer
              ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
              : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {selected === question.correctAnswer
            ? "Goed antwoord."
            : "Nog niet. Kijk even naar het juiste antwoord voordat je doorgaat."}
        </div>
      )}
    </div>
  );
}
