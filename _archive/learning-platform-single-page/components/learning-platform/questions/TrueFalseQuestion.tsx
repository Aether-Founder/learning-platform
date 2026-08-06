"use client";

import { useState } from "react";
import type { Question } from "@/types/learning-platform";
import { MarkdownContent } from "../shared/MarkdownContent";

interface TrueFalseQuestionProps {
  question: Question;
  onAnswer: (selected: string, isCorrect: boolean) => void;
}

export function TrueFalseQuestion({ question, onAnswer }: TrueFalseQuestionProps) {
  const [submitted, setSubmitted] = useState(false);

  const handle = (value: string) => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(value, value === question.correctAnswer);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <MarkdownContent className="text-lg">{question.prompt}</MarkdownContent>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["True", "False"] as const).map((label) => {
          const isCorrect = label === question.correctAnswer;
          let style = "border-border bg-card hover:bg-secondary";
          if (submitted) {
            style = isCorrect
              ? "border-green-500 bg-green-500/15"
              : "border-border opacity-50";
          }
          return (
            <button
              key={label}
              type="button"
              disabled={submitted}
              onClick={() => handle(label)}
              className={`rounded-lg border py-4 font-medium ${style}`}
            >
              {label === "True" ? "True" : "False"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
