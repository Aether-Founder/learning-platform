"use client";

import type { Term } from "@/types/learning-platform";
import { useTranslation } from "@/lib/i18n";

interface MasteryProgressBarProps {
  terms: Term[];
}

export function MasteryProgressBar({ terms }: MasteryProgressBarProps) {
  const { t } = useTranslation();
  const total = terms.length || 1;
  const unstudied = terms.filter((t) => t.masteryStatus === "unstudied").length;
  const learning = terms.filter((t) => t.masteryStatus === "learning").length;
  const due = terms.filter((t) => t.masteryStatus === "due").length;
  const review = terms.filter((t) => t.masteryStatus === "review").length;
  const mastered = terms.filter((t) => t.masteryStatus === "mastered").length;
  const suspended = terms.filter((t) => t.masteryStatus === "suspended").length;

  const pct = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground text-center">
        {t("study_set_label", "Voortgang")}
      </p>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-muted-foreground/40 transition-all"
          style={{ width: pct(unstudied) }}
          title={`${t("mastery_unstudied", "Niet geleerd")}: ${unstudied}`}
        />
        <div
          className="bg-yellow-500 transition-all"
          style={{ width: pct(learning) }}
          title={`${t("mastery_learning", "Bezig met leren")}: ${learning}`}
        />
        <div
          className="bg-orange-500 transition-all"
          style={{ width: pct(due) }}
          title={`Due: ${due}`}
        />
        <div
          className="bg-sky-500 transition-all"
          style={{ width: pct(review) }}
          title={`Review: ${review}`}
        />
        <div
          className="bg-green-600 transition-all"
          style={{ width: pct(mastered) }}
          title={`${t("mastery_mastered", "Beheerst")}: ${mastered}`}
        />
        <div
          className="bg-slate-500 transition-all"
          style={{ width: pct(suspended) }}
          title={`Suspended: ${suspended}`}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40" />
          {t("mastery_unstudied", "Niet geleerd")} ({unstudied})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
          {t("mastery_learning", "Bezig met leren")} ({learning})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />
          Due ({due})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
          Review ({review})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-600" />
          {t("mastery_mastered", "Beheerst")} ({mastered})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />
          Suspended ({suspended})
        </span>
      </div>
    </div>
  );
}
