"use client";

import { FormEvent, useState } from "react";
import { evaluateAnswer, type GradingOptions } from "@/lib/learning-platform/grading";
import type { Question } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";
import { MarkdownContent } from "../shared/MarkdownContent";
import { GradingFeedback } from "../shared/GradingFeedback";

interface WrittenQuestionProps {
  question: Question;
  smartGrading: boolean;
  gradingOptions?: GradingOptions;
  retypeAnswers: boolean;
  onComplete: (userAnswer: string, isCorrect: boolean, wasOverridden: boolean) => void;
}

export function WrittenQuestion({
  question,
  smartGrading,
  gradingOptions,
  retypeAnswers,
  onComplete,
}: WrittenQuestionProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"input" | "feedback" | "retype">("input");
  const [result, setResult] = useState<{
    isCorrect: boolean;
    isTypo: boolean;
    wasOverridden: boolean;
  } | null>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (phase === "retype") {
      const grading = evaluateAnswer(input, question.correctAnswer, smartGrading, gradingOptions);
      if (grading.isCorrect) {
        onComplete(input, false, false);
      }
      return;
    }
    const grading = evaluateAnswer(input, question.correctAnswer, smartGrading, gradingOptions);
    setResult({
      isCorrect: grading.isCorrect,
      isTypo: grading.isTypo,
      wasOverridden: false,
    });
    setPhase("feedback");
  };

  const finish = (isCorrect: boolean, wasOverridden: boolean) => {
    onComplete(input, isCorrect, wasOverridden);
  };

  if (phase === "feedback" && result) {
    const needsRetype = !result.isCorrect && retypeAnswers;
    return (
      <div className="space-y-4">
        <GradingFeedback
          isCorrect={result.isCorrect}
          isTypo={result.isTypo}
          correctAnswer={question.correctAnswer}
          showOverride={!result.isCorrect}
          onOverride={() => finish(true, true)}
          onContinue={() => {
            if (needsRetype) {
              setInput("");
              setPhase("retype");
            } else {
              finish(result.isCorrect, result.wasOverridden);
            }
          }}
          continueLabel={
            needsRetype
              ? t("written_retype_continue", "Typ juiste antwoord")
              : t("grade_continue", "Verder")
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 min-h-[120px] flex items-center justify-center">
        <MarkdownContent className="text-lg text-center font-medium">
          {question.prompt}
        </MarkdownContent>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            phase === "retype"
              ? t("written_retype_placeholder", "Typ het juiste antwoord…")
              : t("written_answer_placeholder", "Jouw antwoord…")
          }
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-foreground/20"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-full rounded-lg bg-foreground text-background py-3 font-medium disabled:opacity-50"
        >
          {phase === "retype" ? t("written_confirm", "Bevestigen") : t("written_check", "Controleer")}
        </button>
      </form>
      {phase === "retype" && (
        <p className="text-sm text-muted-foreground text-center">
          Type the correct answer to continue.
        </p>
      )}
    </div>
  );
}
