"use client";

import { Check, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface GradingFeedbackProps {
  isCorrect: boolean;
  isTypo?: boolean;
  correctAnswer?: string;
  showOverride?: boolean;
  onOverride?: () => void;
  onContinue: () => void;
  continueLabel?: string;
}

export function GradingFeedback({
  isCorrect,
  isTypo,
  correctAnswer,
  showOverride,
  onOverride,
  onContinue,
  continueLabel,
}: GradingFeedbackProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCorrect
          ? "border-green-500/40 bg-green-500/10"
          : "border-red-500/40 bg-red-500/10"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {isCorrect ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <X className="h-5 w-5 text-red-600" />
        )}
        <span>
          {isCorrect
            ? isTypo
              ? t("grade_typo_ok", "Goed (typfout geaccepteerd)")
              : t("grade_correct", "Goed!")
            : t("grade_incorrect", "Fout")}
        </span>
      </div>
      {!isCorrect && correctAnswer && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("grade_correct_answer", "Juiste antwoord")}:{" "}
          <span className="text-foreground font-medium">{correctAnswer}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {!isCorrect && showOverride && onOverride && (
          <button
            type="button"
            onClick={onOverride}
            className="px-4 py-2 rounded-md text-sm border border-border bg-background hover:bg-secondary"
          >
            {t("grade_override", "Ik had het goed")}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="px-4 py-2 rounded-md text-sm bg-foreground text-background font-medium"
        >
          {continueLabel ?? t("grade_continue", "Verder")}
        </button>
      </div>
    </div>
  );
}
